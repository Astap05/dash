import { useState, useEffect, useRef } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { LogOut, Wallet, X, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { getWallets, removeWallet } from '../services/authService'

interface WalletButtonProps {
  variant?: 'header' | 'section'
}

function WalletButton({ variant = 'header' }: WalletButtonProps) {
  const { t } = useLanguage()
  const { address, isConnected, isConnecting, balance, connectWallet, connectWalletConnect, disconnectWallet, reconnectToWallet } = useWalletContext()
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [wallets, setWallets] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Загрузка сохраненных кошельков
  const loadWallets = async () => {
    const walletList = await getWallets()
    // Убираем дубликаты
    const uniqueWallets = Array.from(new Set(walletList))
    setWallets(uniqueWallets)
  }

  useEffect(() => {
    loadWallets()
  }, [address, isConnected]) // Перезагружаем при изменении статуса подключения

  // Закрытие dropdown при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00'
    const num = parseFloat(bal)
    if (num < 0.001) return num.toFixed(6)
    return num.toFixed(4)
  }

  const handleConnectWallet = async () => {
    setShowModal(false)
    await connectWallet()
    await loadWallets() // Обновляем список после подключения
  }

  const handleConnectWalletConnect = async () => {
    setShowModal(false)
    await connectWalletConnect()
    await loadWallets() // Обновляем список после подключения
  }

  const handleSelectWallet = async (walletAddress: string) => {
    setShowDropdown(false)
    // Если уже подключен к этому кошельку, ничего не делаем
    if (address?.toLowerCase() === walletAddress.toLowerCase()) return

    await reconnectToWallet(walletAddress)
  }

  const handleRemoveWallet = async (walletAddress: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await removeWallet(walletAddress)
    setWallets(wallets.filter(w => w !== walletAddress))

    // Если удалили текущий кошелек, отключаемся
    if (address?.toLowerCase() === walletAddress.toLowerCase()) {
      disconnectWallet()
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setShowDropdown(false)
  }

  const openAddWalletModal = () => {
    setShowDropdown(false)
    setShowModal(true)
  }

  // Если кошелек подключен
  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${showDropdown
              ? 'bg-[#1a1a1a] border-orange-500/50'
              : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-gray-600'
            }`}
        >
          {/* Avatar / Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
            {address.slice(2, 4).toUpperCase()}
          </div>

          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              {formatAddress(address)}
              {showDropdown ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </span>
            {balance !== null ? (
              <span className="text-xs text-gray-400">{formatBalance(balance)} ETH</span>
            ) : (
              <div className="h-3 w-12 bg-gray-800 rounded animate-pulse mt-1" />
            )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
              <span className="text-sm font-medium text-gray-400">Мои кошельки</span>
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Отключить
              </button>
            </div>

            {/* Current Wallet (Pinned) */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Активный</div>
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-500/20">
                    {address.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{formatAddress(address)}</span>
                    <span className="text-xs text-orange-400 h-4 flex items-center">
                      {balance !== null ? (
                        `${formatBalance(balance)} ETH`
                      ) : (
                        <div className="h-3 w-16 bg-orange-500/20 rounded animate-pulse" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Other Wallets List */}
            {wallets.filter(w => w.toLowerCase() !== address.toLowerCase()).length > 0 && (
              <div className="p-2 border-t border-[#2a2a2a]">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Сохраненные</div>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {wallets
                    .filter(w => w.toLowerCase() !== address.toLowerCase())
                    .map(wallet => (
                      <div
                        key={wallet}
                        onClick={() => handleSelectWallet(wallet)}
                        className="group flex items-center justify-between p-3 hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-xs group-hover:bg-gray-600 transition-colors">
                            {wallet.slice(2, 4).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                              {formatAddress(wallet)}
                            </span>
                            <span className="text-xs text-gray-500">Нажмите для переключения</span>
                          </div>
                        </div>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleRemoveWallet(wallet, e)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Удалить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add Account Button */}
            <div className="p-2 border-t border-[#2a2a2a]">
              <button
                onClick={openAddWalletModal}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors border border-dashed border-[#3a3a3a] hover:border-gray-500"
              >
                <Plus className="w-4 h-4" />
                Добавить кошелек
              </button>
            </div>
          </div>
        )}

        {/* Modal for adding new wallet */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Подключить кошелек</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-orange-500/50 text-white rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wallet className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">MetaMask</span>
                      <span className="text-xs text-gray-400">Browser extension</span>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </button>

                <button
                  onClick={handleConnectWalletConnect}
                  className="w-full flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-blue-500/50 text-white rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-6 h-6 text-blue-500 font-bold flex items-center justify-center">WC</div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">WalletConnect</span>
                      <span className="text-xs text-gray-400">Mobile wallet & others</span>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Если кошелек НЕ подключен
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
        type="button"
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 ${variant === 'header'
            ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white'
            : 'bg-white text-orange-600 hover:bg-gray-100'
          }`}
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? t('loading') : t('connect_wallet')}
      </button>

      {/* Modal for connecting wallet (when disconnected) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Подключить кошелек</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                className="w-full flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-orange-500/50 text-white rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">MetaMask</span>
                    <span className="text-xs text-gray-400">Browser extension</span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </button>

              <button
                onClick={handleConnectWalletConnect}
                className="w-full flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-blue-500/50 text-white rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-6 h-6 text-blue-500 font-bold flex items-center justify-center">WC</div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">WalletConnect</span>
                    <span className="text-xs text-gray-400">Mobile wallet & others</span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </button>

              {wallets.length > 0 && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#2a2a2a]"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-[#1a1a1a] text-xs text-gray-500 uppercase">Сохраненные</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {wallets.map(wallet => (
                      <div
                        key={wallet}
                        onClick={() => handleSelectWallet(wallet)}
                        className="flex items-center justify-between p-3 bg-[#0a0a0a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs group-hover:bg-gray-700 transition-colors">
                            {wallet.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">{formatAddress(wallet)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleRemoveWallet(wallet, e)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Удалить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WalletButton