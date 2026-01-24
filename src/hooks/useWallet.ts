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

  // WalletConnect provider
  const walletConnectProviderRef = useRef<any>(null)
  // Ref для отслеживания процесса ручного переключения
  const isSwitchingRef = useRef(false)

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
      setWallet((prev) => ({ ...prev, isConnecting: true }))

      // ЯВНО запрашиваем разрешение через wallet_requestPermissions
      // Это гарантирует, что пользователь сможет выбрать аккаунт
      console.log('Requesting permissions for explicit account selection...')
      try {
        await ethereumProvider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        })

        // ВАЖНО: Даем MetaMask время обновить внутреннее состояние после закрытия окна
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (permError: any) {
        if (permError.code === 4001) {
          setWallet((prev) => ({ ...prev, isConnecting: false }))
          throw new Error('Выбор аккаунта отменен пользователем')
        }
        console.warn('wallet_requestPermissions failed, falling back to eth_requestAccounts', permError)
      }

      // Теперь запрашиваем аккаунты
      console.log('Requesting accounts...')

      // Сначала пробуем получить через eth_accounts (часто они уже доступны после прав)
      let accounts = await ethereumProvider.request({ method: 'eth_accounts' })

      if (!accounts || accounts.length === 0) {
        // Если пусто, запрашиваем через eth_requestAccounts
        const accountsPromise = ethereumProvider.request({
          method: 'eth_requestAccounts'
        })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Таймаут подключения. Пожалуйста, проверьте MetaMask и попробуйте снова.')), 10000)
        )
        accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[]
      }

      console.log('Accounts received:', accounts)

      if (!accounts || accounts.length === 0) {
        throw new Error('Аккаунты не получены')
      }

      // Используем адрес из accounts напрямую
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
        walletType: 'metamask',
      })

      localStorage.setItem('walletAddress', address)
      localStorage.setItem('walletType', 'metamask')
      // Сохраняем тип конкретного кошелька
      localStorage.setItem(`wallet_type_${address.toLowerCase()}`, 'metamask')
      updateUserWallet(address)
      addWallet(address)
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))

      if (error.code === 4001 || error.message?.includes('отменен')) {
        showAlert('Подключение кошелька было отменено.')
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
      // Сохраняем тип конкретного кошелька
      localStorage.setItem(`wallet_type_${address.toLowerCase()}`, 'walletconnect')
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
      isSwitchingRef.current = true

      let success = false
      const target = targetAddress.toLowerCase()

      // Определяем предпочтительный тип кошелька
      const savedType = localStorage.getItem(`wallet_type_${target}`)

      // Проверяем, есть ли этот адрес в активной сессии WalletConnect
      let isWalletConnectSessionActive = false
      if (walletConnectProviderRef.current?.session?.namespaces?.eip155?.accounts) {
        const accounts = walletConnectProviderRef.current.session.namespaces.eip155.accounts
        const found = accounts.find((a: string) => a.split(':')[2].toLowerCase() === target)
        if (found) isWalletConnectSessionActive = true
      }

      console.log(`Reconnecting to ${target}. Saved type: ${savedType}, WC Active: ${isWalletConnectSessionActive}`)

      const shouldTryWalletConnect = savedType === 'walletconnect' || isWalletConnectSessionActive
      const shouldTryMetaMask = savedType === 'metamask' || (!savedType && !isWalletConnectSessionActive)

      // 1. Попытка подключения через MetaMask
      if (shouldTryMetaMask && checkWalletInstalled()) {
        try {
          let ethereumProvider = window.ethereum
          if (Array.isArray(window.ethereum.providers)) {
            const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true)
            if (metaMaskProvider) {
              ethereumProvider = metaMaskProvider
            }
          }

          // Проверяем текущий активный аккаунт
          const accounts = await ethereumProvider.request({ method: 'eth_accounts' })
          const currentAddress = accounts && accounts.length > 0 ? accounts[0].toLowerCase() : null

          if (currentAddress && currentAddress === targetAddress.toLowerCase()) {
            // Сценарий А: Аккаунт уже активен в MetaMask -> Быстрое подключение
            console.log('Account already active, connecting directly:', currentAddress)

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
            localStorage.setItem('walletType', 'metamask')
            updateUserWallet(currentAddress)
            success = true
          } else {
            // Сценарий Б: Аккаунт отличается или не подключен -> Запрашиваем переключение
            console.log('Account mismatch. Requesting permissions to switch...')

            try {
              await ethereumProvider.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
              })
              // Даем время на обновление
              await new Promise(resolve => setTimeout(resolve, 500))

              // Запрашиваем новый аккаунт
              const newAccounts = await ethereumProvider.request({ method: 'eth_requestAccounts' })

              // Пытаемся найти целевой адрес среди подключенных
              // MetaMask может вернуть массив аккаунтов, где первый - активный, но мы хотим переключиться на конкретный
              let newAddress = null
              if (newAccounts && newAccounts.length > 0) {
                const target = targetAddress.toLowerCase()
                const found = newAccounts.find((a: string) => a.toLowerCase() === target)
                newAddress = found ? found.toLowerCase() : newAccounts[0].toLowerCase()
              }

              if (newAddress) {
                const provider = new ethers.BrowserProvider(ethereumProvider)
                let network
                let balance
                try {
                  network = await provider.getNetwork()
                  balance = await getBalance(newAddress)
                } catch (e) {
                  network = { chainId: BigInt(1) }
                  balance = null
                }

                setWallet({
                  address: newAddress,
                  isConnected: true,
                  isConnecting: false,
                  balance,
                  chainId: Number(network.chainId),
                  walletType: 'metamask',
                })

                localStorage.setItem('walletAddress', newAddress)
                localStorage.setItem('walletType', 'metamask')
                updateUserWallet(newAddress)
                success = true
              }
            } catch (err: any) {
              if (err.code === 4001) {
                throw new Error('Переключение отклонено пользователем')
              }
              console.warn('Error requesting permissions:', err)
            }
          }
        } catch (error) {
          console.warn('MetaMask reconnect attempt failed:', error)
        }
      }

      // 2. Если MetaMask не сработал (или не установлен), пробуем WalletConnect
      if (!success && shouldTryWalletConnect) {
        try {
          let provider = walletConnectProviderRef.current

          if (!provider) {
            console.log('Initializing WalletConnect provider for reconnection...')
            provider = await EthereumProvider.init({
              projectId: '0cfcc186a4e8df46239712f9d087ce49',
              showQrModal: true,
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
            walletConnectProviderRef.current = provider

            // Подписываемся на события
            provider.on('accountsChanged', (accounts: string[]) => {
              console.log('WalletConnect accounts changed:', accounts)
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

          const session = provider.session
          if (session && session.namespaces && session.namespaces.eip155) {
            const eip155Accounts = session.namespaces.eip155.accounts
            // Ищем нужный аккаунт в сессии
            const foundAccount = eip155Accounts.find((a: string) => a.split(':')[2].toLowerCase() === target)

            // Если нашли конкретный или берем первый если не нашли (но тип был WC)
            const accountToUse = foundAccount || eip155Accounts[0]
            const parsedAddress = accountToUse.split(':')[2].toLowerCase()

            if (parsedAddress) {
              const ethersProvider = new ethers.BrowserProvider(provider)
              let network
              let balance
              try {
                network = await ethersProvider.getNetwork()
                balance = await getBalance(parsedAddress, provider)
              } catch (error: any) {
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
              localStorage.setItem('walletType', 'walletconnect')
              localStorage.setItem(`wallet_type_${parsedAddress}`, 'walletconnect')
              updateUserWallet(parsedAddress)
              success = true
            }
          } else {
            // Сессии нет, инициируем новое подключение
            console.log('No active session, initiating WalletConnect connection...')
            await provider.connect()

            // После успешного подключения получаем сессию
            if (provider.session && provider.session.namespaces && provider.session.namespaces.eip155) {
              const accounts = provider.session.namespaces.eip155.accounts
              const newAddr = accounts[0].split(':')[2].toLowerCase()

              const ethersProvider = new ethers.BrowserProvider(provider)
              let network = { chainId: BigInt(1) }
              let balance = null
              try {
                network = await ethersProvider.getNetwork()
                balance = await getBalance(newAddr, provider)
              } catch (e) { }

              setWallet({
                address: newAddr,
                isConnected: true,
                isConnecting: false,
                balance,
                chainId: Number(network.chainId),
                walletType: 'walletconnect',
              })
              localStorage.setItem('walletAddress', newAddr)
              localStorage.setItem('walletType', 'walletconnect')
              localStorage.setItem(`wallet_type_${newAddr}`, 'walletconnect')
              updateUserWallet(newAddr)
              success = true
            }
          }
        } catch (error) {
          console.warn('WalletConnect reconnect failed:', error)
        }
      }



      if (!success) {
        // Если мы здесь, значит переключение не удалось (отмена или ошибка)
        setWallet((prev) => ({ ...prev, isConnecting: false }))
      }

      // Сбрасываем флаг переключения с небольшой задержкой, чтобы пропустить возможные события
      setTimeout(() => {
        isSwitchingRef.current = false
      }, 1000)

    } catch (error: any) {
      console.error('Error in reconnectToWallet:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      isSwitchingRef.current = false
      if (error.message !== 'Переключение отклонено пользователем') {
        showAlert(error.message || 'Ошибка переподключения кошелька')
      }
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

    const restoreConnection = async () => {
      if (!savedAddress) return

      console.log('Restoring connection for:', savedAddress, savedType)

      if (savedType === 'walletconnect') {
        // Логика восстановления WalletConnect (оставляем как есть, она сложнее)
        try {
          const provider = await EthereumProvider.init({
            projectId: '0cfcc186a4e8df46239712f9d087ce49',
            showQrModal: false,
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

                let network = { chainId: BigInt(1) }
                let balance = null

                try {
                  network = await ethersProvider.getNetwork()
                  balance = await getBalance(parsedAddress, provider)
                } catch (e) { console.warn(e) }

                setWallet({
                  address: parsedAddress,
                  isConnected: true,
                  isConnecting: false,
                  balance,
                  chainId: Number(network.chainId),
                  walletType: 'walletconnect',
                })

                // Listeners
                provider.on('accountsChanged', (accounts: string[]) => {
                  if (accounts.length === 0) disconnectWallet()
                  else {
                    const newAddr = accounts[0]
                    setWallet(prev => ({ ...prev, address: newAddr }))
                    localStorage.setItem('walletAddress', newAddr)
                    updateUserWallet(newAddr)
                  }
                })
                provider.on('disconnect', () => disconnectWallet())
              }
            }
          }
        } catch (e) {
          console.warn('Failed to restore WalletConnect session', e)
        }
      } else if (savedType === 'metamask' || !savedType) {
        // Восстановление MetaMask
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts && accounts.length > 0) {
              const currentAddress = accounts[0].toLowerCase()
              if (currentAddress === savedAddress.toLowerCase()) {
                // Успешное восстановление
                const provider = new ethers.BrowserProvider(window.ethereum)
                let network = { chainId: BigInt(1) }
                let balance = null
                try {
                  network = await provider.getNetwork()
                  balance = await getBalance(currentAddress)
                } catch (e) { console.warn(e) }

                setWallet({
                  address: currentAddress,
                  isConnected: true,
                  isConnecting: false,
                  balance,
                  chainId: Number(network.chainId),
                  walletType: 'metamask',
                })
              } else {
                console.log('Saved address does not match active MetaMask account')
                // Не отключаем, просто не подключаем автоматически, чтобы не путать пользователя
                // Или можно подключить текущий активный?
                // Лучше ничего не делать, пусть пользователь сам нажмет Connect
              }
            }
          } catch (e) {
            console.warn('Failed to restore MetaMask session', e)
          }
        }
      }
    }

    restoreConnection()

    // Слушатели событий MetaMask
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('MetaMask accountsChanged:', accounts)
        // Если мы в процессе ручного переключения, игнорируем событие, 
        // так как мы сами обновим состояние в reconnectToWallet
        if (isSwitchingRef.current) {
          console.log('Ignoring accountsChanged event due to manual switch in progress')
          return
        }

        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          // Если мы уже подключены, обновляем адрес
          setWallet(prev => {
            if (prev.isConnected) {
              const newAddress = accounts[0]

              // Если текущий адрес все еще в списке подключенных, и это не явное изменение первого аккаунта...
              // Но обычно accounts[0] это активный аккаунт.
              // Доверимся MetaMask: если пришло событие, значит что-то изменилось.

              localStorage.setItem('walletAddress', newAddress)
              updateUserWallet(newAddress)
              // Обновляем баланс
              getBalance(newAddress).then(bal => {
                setWallet(p => ({ ...p, address: newAddress, balance: bal }))
              })
              return { ...prev, address: newAddress }
            }
            return prev
          })
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', () => window.location.reload())

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', () => window.location.reload())
      }
    }
  }, [disconnectWallet, getBalance]) // Убрали лишние зависимости, чтобы избежать пересоздания эффекта

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
