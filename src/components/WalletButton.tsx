import { useState, useEffect } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { LogOut, Wallet, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { getWallets, removeWallet } from '../services/authService'

interface WalletButtonProps {
  variant?: 'header' | 'section'
}

function WalletButton({ variant = 'header' }: WalletButtonProps) {
  const { t } = useLanguage()
  const { address, isConnected, isConnecting, balance, connectWallet, connectWalletConnect, disconnectWallet, reconnectToWallet } = useWalletContext()
  const [showModal, setShowModal] = useState(false)
  const [wallets, setWallets] = useState<string[]>([])

  useEffect(() => {
    const loadWallets = async () => {
      const walletList = await getWallets()
      setWallets(walletList)
    }
    loadWallets()
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

  const handleOpenModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const handleConnectWallet = async () => {
    setShowModal(false)
    await connectWallet()
  }

  const handleConnectWalletConnect = async () => {
    setShowModal(false)
    await connectWalletConnect()
  }

  const handleSelectWallet = async (walletAddress: string) => {
    setShowModal(false)
    await reconnectToWallet(walletAddress)
  }

  const handleRemoveWallet = async (walletAddress: string) => {
    await removeWallet(walletAddress)
    setWallets(wallets.filter(w => w !== walletAddress))
  }

  const modalContent = isConnected ? (
    // Когда подключен, показываем только сохраненные кошельки
    <>
      <h4 className="text-sm text-gray-400">Выберите кошелек:</h4>
      {wallets.map(wallet => (
        <div key={wallet} className={`flex items-center justify-between p-2 rounded-lg ${
          wallet.toLowerCase() === address?.toLowerCase() ? 'bg-orange-500/20 border border-orange-500' : 'bg-[#0a0a0a]'
        }`}>
          <span className="text-sm font-mono">{formatAddress(wallet)}</span>
          <div className="flex gap-2">
            {wallet.toLowerCase() !== address?.toLowerCase() && (
              <button
                onClick={() => handleSelectWallet(wallet)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Выбрать
              </button>
            )}
            <button
              onClick={() => handleRemoveWallet(wallet)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </>
  ) : (
    // Когда не подключен, показываем кнопки новых подключений + сохраненные
    <>
      <button
        onClick={handleConnectWallet}
        className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
      >
        MetaMask
      </button>
      <button
        onClick={handleConnectWalletConnect}
        className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
      >
        WalletConnect
      </button>
      {wallets.length > 0 && (
        <>
          <hr className="border-[#2a2a2a]" />
          <h4 className="text-sm text-gray-400">Сохраненные кошельки:</h4>
          {wallets.map(wallet => (
            <div key={wallet} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
              <span className="text-sm font-mono">{formatAddress(wallet)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectWallet(wallet)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Подключить
                </button>
                <button
                  onClick={() => handleRemoveWallet(wallet)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )

  // Показываем подключенный кошелек
  if (isConnected && address) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <button onClick={handleOpenModal} className="text-sm font-semibold hover:text-orange-400 transition-colors">
              {formatAddress(address)} ▼
            </button>
            {balance && (
              <div className="text-xs text-gray-400">{formatBalance(balance)} ETH</div>
            )}
          </div>
          <button
            onClick={disconnectWallet}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-opacity ${
              variant === 'header'
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
                : 'bg-white text-orange-600 hover:bg-gray-100'
            }`}
            title={t('disconnect')}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('disconnect')}</span>
          </button>
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Подключить кошелек</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
                >
                  MetaMask
                </button>
                <button
                  onClick={handleConnectWalletConnect}
                  className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  WalletConnect
                </button>
                {wallets.length > 0 && (
                  <>
                    <hr className="border-[#2a2a2a]" />
                    <h4 className="text-sm text-gray-400">Сохраненные кошельки:</h4>
                    {wallets.map(wallet => (
                      <div key={wallet} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                        <span className="text-sm font-mono">{formatAddress(wallet)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectWallet(wallet)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Подключить
                          </button>
                          <button
                            onClick={() => handleRemoveWallet(wallet)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Если есть адрес, но не подключен
  if (address && !isConnected) {
    return (
      <>
        <button
          onClick={handleOpenModal}
          disabled={isConnecting}
          type="button"
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
            variant === 'header'
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
              : 'bg-white text-orange-600 hover:bg-gray-100'
          }`}
          title={`${t('connect_wallet')} ${formatAddress(address)}`}
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? t('loading') : `${t('connect_wallet')} ${formatAddress(address)}`}
        </button>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Подключить кошелек</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
                >
                  MetaMask
                </button>
                <button
                  onClick={handleConnectWalletConnect}
                  className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  WalletConnect
                </button>
                {wallets.length > 0 && (
                  <>
                    <hr className="border-[#2a2a2a]" />
                    <h4 className="text-sm text-gray-400">Сохраненные кошельки:</h4>
                    {wallets.map(wallet => (
                      <div key={wallet} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                        <span className="text-sm font-mono">{formatAddress(wallet)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectWallet(wallet)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Подключить
                          </button>
                          <button
                            onClick={() => handleRemoveWallet(wallet)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Стандартная кнопка подключения
  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={isConnecting}
        type="button"
        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === 'header'
            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
            : 'bg-white text-orange-600 hover:bg-gray-100'
        }`}
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? t('loading') : t('connect_wallet')}
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Подключить кошелек</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
              >
                MetaMask
              </button>
              <button
                onClick={handleConnectWalletConnect}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
              >
                WalletConnect
              </button>
              {wallets.length > 0 && (
                <>
                  <hr className="border-[#2a2a2a]" />
                  <h4 className="text-sm text-gray-400">Сохраненные кошельки:</h4>
                  {wallets.map(wallet => (
                    <div key={wallet} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                      <span className="text-sm font-mono">{formatAddress(wallet)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectWallet(wallet)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Подключить
                        </button>
                        <button
                          onClick={() => handleRemoveWallet(wallet)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
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