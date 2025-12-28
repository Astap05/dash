import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { updateUserWallet } from '../services/authService'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string | null
  chainId: number | null
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    balance: null,
    chainId: null,
  })

  // Флаги для предотвращения автоматического подключения
  const isInitialLoadRef = useRef(true)
  const userInitiatedConnectionRef = useRef(false)

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
  const getBalance = useCallback(async (address: string) => {
    if (!checkWalletInstalled()) return null
    try {
      if (window.ethereum) {
        let ethereumProvider = window.ethereum
        if (Array.isArray(window.ethereum.providers)) {
          const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true)
          if (metaMaskProvider) {
            ethereumProvider = metaMaskProvider
          }
        }
        
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const balance = await provider.getBalance(address)
        return ethers.formatEther(balance)
      }
      return null
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
      alert('MetaMask не найден!\n\nЭто приложение работает только с MetaMask.\n\nПожалуйста, установите MetaMask для продолжения.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    // Дополнительная проверка перед подключением
    if (!window.ethereum || typeof window.ethereum.request !== 'function') {
      alert('MetaMask не найден или не активен.\n\nПожалуйста, убедитесь, что MetaMask установлен и включен.')
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
      })

      // Сохраняем адрес в localStorage
      localStorage.setItem('walletAddress', address)
      
      // Обновляем адрес кошелька в профиле пользователя
      updateUserWallet(address)
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      
      if (error.code === 4001) {
        alert('Подключение кошелька было отклонено пользователем.')
      } else if (error.message?.includes('MetaMask') || error.message?.includes('extension not found')) {
        alert('MetaMask не найден или не активен.\n\nПожалуйста, установите MetaMask для работы с этим приложением.')
        window.open('https://metamask.io/download/', '_blank')
      } else {
        const errorMsg = error.message || error.toString() || 'Неизвестная ошибка'
        console.error('Full error:', error)
        alert('Ошибка подключения кошелька: ' + errorMsg)
      }
    }
  }, [getBalance, checkWalletInstalled])

  // Отключение кошелька
  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
      balance: null,
      chainId: null,
    })
    localStorage.removeItem('walletAddress')
    updateUserWallet(null)
  }, [])

  // Проверка подключения при загрузке
  useEffect(() => {
    // НЕ подключаемся автоматически при загрузке
    // НЕ показываем сохраненный адрес - пользователь должен явно подключиться
    // Это обеспечивает безопасность - кошелек не подключается без явного разрешения
    console.log('Page loaded - wallet not auto-connected, user must click CONNECT WALLET')

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
      const balance = await getBalance(wallet.address!)
      setWallet((prev) => ({ ...prev, balance }))
    }

    updateBalance()
    const interval = setInterval(updateBalance, 10000) // Обновляем каждые 10 секунд

    return () => clearInterval(interval)
  }, [wallet.address, getBalance])

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled: checkWalletInstalled(),
  }
}

// Расширяем Window interface для TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

