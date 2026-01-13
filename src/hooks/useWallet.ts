import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { updateUserWallet, addWallet } from '../services/authService'
import { useNotification } from '../contexts/NotificationContext'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string | null
  chainId: number | null
  walletType: 'metamask' | 'walletconnect' | null
}

export function useWallet() {
  const { showAlert } = useNotification()

  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    balance: null,
    chainId: null,
    walletType: null,
  })

  // Флаги для предотвращения автоматического подключения
  const isInitialLoadRef = useRef(true)
  const userInitiatedConnectionRef = useRef(false)

  // WalletConnect provider
  const walletConnectProviderRef = useRef<any>(null)

  // Проверяем, установлен ли MetaMask
  const checkWalletInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    // Проверяем window.ethereum
    if (typeof window.ethereum === 'undefined') return false
    
    // Проверяем, что это именно MetaMask
    try {
      // Проверяем наличие методов Ethereum
      if (!window.ethereum || typeof window.ethereum.request !== 'function') {
        return false
      }
      
      // Проверяем, что это MetaMask
      // Иногда MetaMask может быть в массиве providers (когда установлено несколько кошельков)
      let isMetaMask = false
      
      if (Array.isArray(window.ethereum.providers)) {
        // Если есть массив провайдеров, ищем MetaMask среди них
        isMetaMask = window.ethereum.providers.some((p: any) => p.isMetaMask === true)
      } else {
        // Проверяем напрямую
        isMetaMask = window.ethereum.isMetaMask === true
      }
      
      // Если не нашли флаг isMetaMask, но есть window.ethereum с request, пробуем подключиться
      // (может быть проблема с определением флага, но кошелек работает)
      if (!isMetaMask && typeof window.ethereum.request === 'function') {
        // Пробуем проверить через запрос
        return true
      }
      
      return isMetaMask
    } catch (e) {
      console.warn('Error checking wallet:', e)
      return false
    }
  }, [])

  // Получение баланса
  const getBalance = useCallback(async (address: string, provider?: any) => {
    try {
      let ethereumProvider = provider

      if (!ethereumProvider) {
        if (!checkWalletInstalled()) return null
        ethereumProvider = window.ethereum
        if (Array.isArray(window.ethereum.providers)) {
          const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true)
          if (metaMaskProvider) {
            ethereumProvider = metaMaskProvider
          }
        }
      }

      const ethersProvider = new ethers.BrowserProvider(ethereumProvider)
      const balance = await ethersProvider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error: any) {
      // Игнорируем ошибки RPC, но логируем их
      if (error.code === -32002 || error.message?.includes('RPC endpoint')) {
        console.warn('RPC endpoint error, balance unavailable:', error.message)
      } else {
        console.error('Error fetching balance:', error)
      }
      return null
    }
  }, [checkWalletInstalled])

  // Подключение кошелька
  const connectWallet = useCallback(async () => {
    console.log('connectWallet called')
    
    // Проверяем наличие MetaMask
    if (!checkWalletInstalled()) {
      console.log('MetaMask not found')
      showAlert('MetaMask не найден!\n\nЭто приложение работает только с MetaMask.\n\nПожалуйста, установите MetaMask для продолжения.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    // Дополнительная проверка перед подключением
    if (!window.ethereum || typeof window.ethereum.request !== 'function') {
      showAlert('MetaMask не найден или не активен.\n\nПожалуйста, убедитесь, что MetaMask установлен и включен.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    
    // Если есть массив providers, используем MetaMask из него
    let ethereumProvider = window.ethereum
    if (Array.isArray(window.ethereum.providers)) {
      const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true)
      if (metaMaskProvider) {
        ethereumProvider = metaMaskProvider
      }
    }

    try {
      console.log('Starting wallet connection... (USER INITIATED - explicit action)')
      // Устанавливаем флаг, что подключение инициировано пользователем
      userInitiatedConnectionRef.current = true
      setWallet((prev) => ({ ...prev, isConnecting: true }))

      // ВСЕГДА запрашиваем разрешение через wallet_requestPermissions
      // Это гарантирует, что модальное окно MetaMask всегда будет показано
      console.log('Requesting permissions with user confirmation...')
      
      // Сначала запрашиваем разрешения явно - это ВСЕГДА покажет модальное окно
      try {
        await ethereumProvider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        })
        console.log('Permissions granted by user')
      } catch (permError: any) {
        // Если пользователь отклонил разрешение, выбрасываем ошибку
        if (permError.code === 4001) {
          setWallet((prev) => ({ ...prev, isConnecting: false }))
          throw new Error('Разрешение отклонено пользователем')
        }
        // Если разрешение уже есть, продолжаем (но это не должно происходить, так как мы запрашиваем заново)
        console.log('Permissions already granted or error:', permError)
      }
      
      // Теперь запрашиваем аккаунты
      console.log('Requesting accounts...')
      const accountsPromise = ethereumProvider.request({ 
        method: 'eth_requestAccounts' 
      })
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Таймаут подключения. Пожалуйста, проверьте MetaMask и попробуйте снова.')), 10000)
      )
      
      // Ждем либо ответ от MetaMask, либо таймаут
      const accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[]
      
      console.log('Accounts received:', accounts)
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Аккаунты не получены')
      }

      // Используем адрес из accounts напрямую, так как он более актуальный
      const address = accounts[0]
      console.log('Address from accounts:', address)
      
      const provider = new ethers.BrowserProvider(ethereumProvider)
      console.log('Provider created')
      
      let network
      let balance
      
      try {
        network = await provider.getNetwork()
        balance = await getBalance(address)
        console.log('Balance:', balance)
      } catch (error: any) {
        // Если ошибка RPC, все равно сохраняем адрес
        console.warn('Error getting network/balance (RPC issue), continuing anyway:', error.message)
        network = { chainId: BigInt(1) } // Default to mainnet
        balance = null
      }

      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
        balance,
        chainId: Number(network.chainId),
        walletType: 'metamask',
      })

      // Сохраняем адрес в localStorage
      localStorage.setItem('walletAddress', address)
      localStorage.setItem('walletType', 'metamask')

      // Обновляем адрес кошелька в профиле пользователя
      updateUserWallet(address)

      // Добавляем в список сохраненных кошельков
      addWallet(address)
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      
      if (error.code === 4001) {
        showAlert('Подключение кошелька было отклонено пользователем.')
      } else if (error.message?.includes('MetaMask') || error.message?.includes('extension not found')) {
        showAlert('MetaMask не найден или не активен.\n\nПожалуйста, установите MetaMask для работы с этим приложением.')
        window.open('https://metamask.io/download/', '_blank')
      } else {
        const errorMsg = error.message || error.toString() || 'Неизвестная ошибка'
        console.error('Full error:', error)
        showAlert('Ошибка подключения кошелька: ' + errorMsg)
      }
    }
  }, [getBalance, checkWalletInstalled])

  // Подключение через WalletConnect
  const connectWalletConnect = useCallback(async () => {
    console.log('connectWalletConnect called')

    try {
      console.log('Initializing WalletConnect provider...')
      userInitiatedConnectionRef.current = true
      setWallet((prev) => ({ ...prev, isConnecting: true }))

      // Инициализируем WalletConnect провайдер
      const provider = await EthereumProvider.init({
        projectId: '0cfcc186a4e8df46239712f9d087ce49', // Тестовый projectId для демонстрации
        showQrModal: true,
        chains: [1], // Ethereum mainnet
        optionalChains: [137, 56, 43114], // Polygon, BSC, Avalanche
        methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
        events: ['chainChanged', 'accountsChanged'],
        metadata: {
          name: 'Staking Dashboard',
          description: 'Crypto staking platform',
          url: window.location.origin,
          icons: [`${window.location.origin}/icon.png`],
        },
      })

      walletConnectProviderRef.current = provider

      // Подключаемся с ожиданием события connect
      const connectPromise = new Promise<void>((resolve, reject) => {
        provider.on('connect', () => {
          console.log('WalletConnect connected event received')
          resolve()
        })

        provider.on('disconnect', () => {
          console.log('WalletConnect disconnect event received')
          reject(new Error('WalletConnect disconnected during connection'))
        })

        // Начинаем подключение
        provider.connect().catch(reject)
      })

      await connectPromise

      console.log('WalletConnect connect promise resolved')
      console.log('Provider session:', provider.session)

      const session = provider.session
      if (!session || !session.namespaces || !session.namespaces.eip155) {
        throw new Error('WalletConnect session not established properly')
      }

      const eip155Accounts = session.namespaces.eip155.accounts
      console.log('EIP155 accounts:', eip155Accounts)

      if (!eip155Accounts || eip155Accounts.length === 0) {
        throw new Error('Аккаунты не получены от WalletConnect. Пожалуйста, убедитесь, что вы подтвердили подключение в приложении кошелька.')
      }

      // Парсим адрес из формата "eip155:1:0x..."
      const address = eip155Accounts[0].split(':')[2]
      console.log('Parsed address:', address)
      console.log('Address from WalletConnect:', address)

      const ethersProvider = new ethers.BrowserProvider(provider)

      let network
      let balance

      try {
        network = await ethersProvider.getNetwork()
        balance = await getBalance(address, provider)
        console.log('WalletConnect Balance:', balance)
      } catch (error: any) {
        console.warn('Error getting network/balance (RPC issue), continuing anyway:', error.message)
        network = { chainId: BigInt(1) }
        balance = null
      }

      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
        balance,
        chainId: Number(network.chainId),
        walletType: 'walletconnect',
      })

      // Сохраняем адрес
      localStorage.setItem('walletAddress', address)
      localStorage.setItem('walletType', 'walletconnect')
      updateUserWallet(address)

      // Добавляем в список сохраненных кошельков
      addWallet(address)

      // Слушаем события WalletConnect
      provider.on('accountsChanged', (accounts: string[]) => {
        console.log('WalletConnect accounts changed:', accounts)
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          // Обновляем адрес
          const newAddress = accounts[0]
          setWallet((prev) => ({ ...prev, address: newAddress }))
          localStorage.setItem('walletAddress', newAddress)
          updateUserWallet(newAddress)
        }
      })

      provider.on('chainChanged', () => {
        window.location.reload()
      })

      provider.on('disconnect', () => {
        console.log('WalletConnect disconnected')
        disconnectWallet()
      })

    } catch (error: any) {
      console.error('Error connecting WalletConnect:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))

      if (error.code === 4001) {
        showAlert('Подключение через WalletConnect было отклонено.')
      } else {
        const errorMsg = error.message || error.toString() || 'Неизвестная ошибка'
        showAlert('Ошибка подключения через WalletConnect: ' + errorMsg)
      }
    }
  }, [getBalance])

  // Переключение на сохраненный кошелек
  const reconnectToWallet = useCallback(async (targetAddress: string) => {
    try {
      setWallet((prev) => ({ ...prev, isConnecting: true }))

      // Проверяем тип кошелька по сохраненному адресу или логике
      // Для простоты, пробуем MetaMask сначала
      let success = false

      if (checkWalletInstalled()) {
        try {
          let ethereumProvider = window.ethereum
          if (Array.isArray(window.ethereum.providers)) {
            const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true)
            if (metaMaskProvider) {
              ethereumProvider = metaMaskProvider
            }
          }

          const accounts = await ethereumProvider.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            const currentAddress = accounts[0].toLowerCase()
            if (currentAddress === targetAddress.toLowerCase()) {
              // Адрес совпадает, подключаем MetaMask
              const provider = new ethers.BrowserProvider(ethereumProvider)

              let network
              let balance

              try {
                network = await provider.getNetwork()
                balance = await getBalance(currentAddress)
              } catch (error: any) {
                console.warn('Error getting network/balance:', error.message)
                network = { chainId: BigInt(1) }
                balance = null
              }

              setWallet({
                address: currentAddress,
                isConnected: true,
                isConnecting: false,
                balance,
                chainId: Number(network.chainId),
                walletType: 'metamask',
              })

              localStorage.setItem('walletAddress', currentAddress)
              updateUserWallet(currentAddress)
              success = true
            }
          }
        } catch (error) {
          console.warn('MetaMask reconnect failed:', error)
        }
      }

      // Если не MetaMask, пробуем WalletConnect
      if (!success && walletConnectProviderRef.current) {
        try {
          const provider = walletConnectProviderRef.current
          const session = provider.session
          if (session && session.namespaces && session.namespaces.eip155) {
            const eip155Accounts = session.namespaces.eip155.accounts
            const parsedAddress = eip155Accounts[0].split(':')[2].toLowerCase()
            if (parsedAddress === targetAddress.toLowerCase()) {
              // Адрес совпадает, подключаем WalletConnect
              const ethersProvider = new ethers.BrowserProvider(provider)

              let network
              let balance

              try {
                network = await ethersProvider.getNetwork()
                balance = await getBalance(parsedAddress, provider)
              } catch (error: any) {
                console.warn('Error getting network/balance:', error.message)
                network = { chainId: BigInt(1) }
                balance = null
              }

              setWallet({
                address: parsedAddress,
                isConnected: true,
                isConnecting: false,
                balance,
                chainId: Number(network.chainId),
                walletType: 'walletconnect',
              })

              localStorage.setItem('walletAddress', parsedAddress)
              updateUserWallet(parsedAddress)
              success = true
            }
          }
        } catch (error) {
          console.warn('WalletConnect reconnect failed:', error)
        }
      }

      if (!success) {
        throw new Error(`Переключитесь на адрес ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} в соответствующем кошельке и попробуйте снова.`)
      }

    } catch (error: any) {
      console.error('Error reconnecting wallet:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      showAlert(error.message || 'Ошибка переподключения кошелька')
    }
  }, [checkWalletInstalled, getBalance])

  // Отключение кошелька
  const disconnectWallet = useCallback(() => {
    // Отключаем WalletConnect если подключен
    if (walletConnectProviderRef.current) {
      try {
        walletConnectProviderRef.current.disconnect()
      } catch (error) {
        console.warn('Error disconnecting WalletConnect:', error)
      }
      walletConnectProviderRef.current = null
    }

    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
      balance: null,
      chainId: null,
      walletType: null,
    })
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletType')
    updateUserWallet(null)
  }, [])

  // Проверка подключения при загрузке
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress')
    const savedType = localStorage.getItem('walletType')

    if (savedAddress && savedType === 'walletconnect') {
      // Для WalletConnect, инициализируем provider и проверяем session
      (async () => {
        try {
          const provider = await EthereumProvider.init({
            projectId: '0cfcc186a4e8df46239712f9d087ce49',
            showQrModal: false, // Не показывать QR при reconnect
            chains: [1],
            optionalChains: [137, 56, 43114],
            methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
            events: ['chainChanged', 'accountsChanged'],
            metadata: {
              name: 'Staking Dashboard',
              description: 'Crypto staking platform',
              url: window.location.origin,
              icons: [`${window.location.origin}/icon.png`],
            },
          })

          if (provider.session) {
            const session = provider.session
            if (session.namespaces && session.namespaces.eip155) {
              const eip155Accounts = session.namespaces.eip155.accounts
              const parsedAddress = eip155Accounts[0].split(':')[2].toLowerCase()
              if (parsedAddress === savedAddress.toLowerCase()) {
                walletConnectProviderRef.current = provider

                const ethersProvider = new ethers.BrowserProvider(provider)
                let network
                let balance

                try {
                  network = await ethersProvider.getNetwork()
                  balance = await getBalance(parsedAddress, provider)
                } catch (error: any) {
                  console.warn('Error getting network/balance:', error.message)
                  network = { chainId: BigInt(1) }
                  balance = null
                }

                setWallet({
                  address: parsedAddress,
                  isConnected: true,
                  isConnecting: false,
                  balance,
                  chainId: Number(network.chainId),
                  walletType: 'walletconnect',
                })

                // Слушаем события
                provider.on('accountsChanged', (accounts: string[]) => {
                  if (accounts.length === 0) {
                    disconnectWallet()
                  } else {
                    const newAddress = accounts[0]
                    setWallet((prev) => ({ ...prev, address: newAddress }))
                    localStorage.setItem('walletAddress', newAddress)
                    updateUserWallet(newAddress)
                  }
                })

                provider.on('chainChanged', () => {
                  window.location.reload()
                })

                provider.on('disconnect', () => {
                  console.log('WalletConnect disconnected')
                  disconnectWallet()
                })
              }
            }
          }
        } catch (error) {
          console.warn('WalletConnect reconnect failed:', error)
        }
      })()
    } else if (savedAddress) {
      // Для MetaMask или других, пытаемся reconnect
      reconnectToWallet(savedAddress).catch(() => {
        // Игнорируем ошибки, пользователь подключит вручную
      })
    }

    console.log('Page loaded - attempting to reconnect saved wallet')

    // Сбрасываем флаг начальной загрузки
    isInitialLoadRef.current = true

    // Слушаем изменения аккаунта
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed in MetaMask:', accounts, 'isInitialLoad:', isInitialLoadRef.current, 'userInitiated:', userInitiatedConnectionRef.current)
        
        // Игнорируем первое событие при загрузке страницы - это может быть автоматическое подключение MetaMask
        if (isInitialLoadRef.current) {
          console.log('Ignoring initial accountsChanged event (auto-connect prevention)')
          isInitialLoadRef.current = false
          return
        }

        // Если подключение было инициировано пользователем, не обрабатываем это событие
        if (userInitiatedConnectionRef.current) {
          console.log('User initiated connection, ignoring accountsChanged')
          userInitiatedConnectionRef.current = false
          return
        }

        if (accounts.length === 0) {
          // Аккаунт отключен - отключаем кошелек
          console.log('Account disconnected in MetaMask')
          disconnectWallet()
        } else {
          // Аккаунт изменился в MetaMask - отключаем текущее подключение
          // Пользователь должен явно нажать "CONNECT WALLET" для подключения к новому аккаунту
          console.log('Account changed in MetaMask, disconnecting for security')
          setWallet({
            address: null,
            isConnected: false,
            isConnecting: false,
            balance: null,
            chainId: null,
            walletType: null,
          })
          // НЕ обновляем сохраненный адрес автоматически - пользователь должен явно подключиться
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      // Устанавливаем флаг после небольшой задержки, чтобы игнорировать начальное событие
      setTimeout(() => {
        isInitialLoadRef.current = false
      }, 2000) // Увеличиваем задержку до 2 секунд

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [disconnectWallet]) // Убрали лишние зависимости, чтобы избежать пересоздания эффекта

  // Обновление баланса
  useEffect(() => {
    if (!wallet.address) return

    const updateBalance = async () => {
      let provider
      if (wallet.walletType === 'walletconnect' && walletConnectProviderRef.current) {
        provider = walletConnectProviderRef.current
      }
      const balance = await getBalance(wallet.address!, provider)
      setWallet((prev) => ({ ...prev, balance }))
    }

    updateBalance()
    const interval = setInterval(updateBalance, 10000) // Обновляем каждые 10 секунд

    return () => clearInterval(interval)
  }, [wallet.address, wallet.walletType, getBalance])

  return {
    ...wallet,
    connectWallet,
    connectWalletConnect,
    disconnectWallet,
    reconnectToWallet,
    isMetaMaskInstalled: checkWalletInstalled(),
  }
}

// Расширяем Window interface для TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

