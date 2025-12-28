import { useWalletContext } from '../contexts/WalletContext'
import { LogOut, Wallet } from 'lucide-react'

interface WalletButtonProps {
  variant?: 'header' | 'section'
}

function WalletButton({ variant = 'header' }: WalletButtonProps) {
  const { address, isConnected, isConnecting, balance, connectWallet, disconnectWallet } = useWalletContext()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00'
    const num = parseFloat(bal)
    if (num < 0.001) return num.toFixed(6)
    return num.toFixed(4)
  }

  // Показываем подключенный кошелек только если isConnected === true
  // Если есть адрес, но isConnected === false, значит это сохраненный адрес, но не подключенный
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <div className="text-sm font-semibold">{formatAddress(address)}</div>
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
          title="Отключить кошелек"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    )
  }

  // Если есть адрес, но не подключен - показываем кнопку подключения
  if (address && !isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        type="button"
        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === 'header'
            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
            : 'bg-white text-orange-600 hover:bg-gray-100'
        }`}
        title={`Подключить кошелек ${formatAddress(address)}`}
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : `CONNECT ${formatAddress(address)}`}
      </button>
    )
  }

  const handleConnect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Button clicked, connecting wallet...', { isConnecting, connectWallet })
    if (!isConnecting) {
      connectWallet().catch((error) => {
        console.error('Error in connectWallet:', error)
      })
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      type="button"
      className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'header'
          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
          : 'bg-white text-orange-600 hover:bg-gray-100'
      }`}
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'CONNECT WALLET'}
    </button>
  )
}

export default WalletButton

