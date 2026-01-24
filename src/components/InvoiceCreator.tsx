import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { getCurrentUser } from '../services/authService'
import { useLanguage } from '../contexts/LanguageContext'
import AlertModal from './AlertModal'
import CryptoIcon from './CryptoIcon'

interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  network: string
  icon: string
  available: boolean
}

const networks = [
  { id: 'all', name: 'ALL', label: 'ALL' },
  { id: 'ethereum', name: 'Ethereum', label: 'Ethereum (ERC20)' },
  { id: 'bsc', name: 'BNB Chain', label: 'BNB Chain (BEP20)' },
  { id: 'polygon', name: 'Polygon', label: 'Polygon (POLYGON)' },
  { id: 'solana', name: 'Solana', label: 'Solana (SOL)' },
  { id: 'arbitrum', name: 'Arbitrum', label: 'Arbitrum (ARB1)' },
  { id: 'avax', name: 'AVAX C-Chain', label: 'AVAX C-Chain' },
  { id: 'tron', name: 'TRON', label: 'TRON (TRC20)' },
  { id: 'bitcoin', name: 'Bitcoin', label: 'Bitcoin' },
  { id: 'ripple', name: 'Ripple', label: 'Ripple (XRP)' },
  { id: 'dogecoin', name: 'Dogecoin', label: 'Dogecoin' },
  { id: 'cardano', name: 'Cardano', label: 'Cardano' },
  { id: 'monero', name: 'Monero', label: 'Monero' },
  { id: 'bitcoincash', name: 'Bitcoin Cash', label: 'Bitcoin Cash' },
  { id: 'stellar', name: 'Stellar', label: 'Stellar' },
  { id: 'zcash', name: 'Zcash', label: 'Zcash' },
  { id: 'sui', name: 'Sui', label: 'Sui' },
]

const cryptocurrencies: CryptoCurrency[] = [
  // 1. Bitcoin (BTC)
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin BTC', network: 'bitcoin', icon: '₿', available: true },

  // 2. Ethereum (ETH)
  { id: 'eth', symbol: 'ETH', name: 'Ethereum ETH', network: 'ethereum', icon: 'Ξ', available: true },

  // 3. Tether (USDT) - Multiple networks
  { id: 'usdt-erc20', symbol: 'USDT', name: 'Tether USDT ERC20', network: 'ethereum', icon: '₮', available: true },
  { id: 'usdt-bep20', symbol: 'USDT', name: 'Tether USDT BEP20', network: 'bsc', icon: '₮', available: true },
  { id: 'usdt-trc20', symbol: 'USDT', name: 'Tether USDT TRC20', network: 'tron', icon: '₮', available: true },
  { id: 'usdt-polygon', symbol: 'USDT', name: 'Tether USDT POLYGON', network: 'polygon', icon: '₮', available: true },
  { id: 'usdt-sol', symbol: 'USDT', name: 'Tether USDT SOL', network: 'solana', icon: '₮', available: true },
  { id: 'usdt-arb1', symbol: 'USDT', name: 'Tether USDT ARB1', network: 'arbitrum', icon: '₮', available: true },
  { id: 'usdt-avaxc', symbol: 'USDT', name: 'Tether USDT AVAXC', network: 'avax', icon: '₮', available: true },

  // 4. BNB
  { id: 'bnb', symbol: 'BNB', name: 'BNB', network: 'bsc', icon: 'B', available: true },

  // 5. XRP
  { id: 'xrp', symbol: 'XRP', name: 'XRP', network: 'ripple', icon: 'X', available: true },

  // 6. Solana (SOL)
  { id: 'sol', symbol: 'SOL', name: 'Solana SOL', network: 'solana', icon: 'S', available: true },

  // 7. USDC - Multiple networks
  { id: 'usdc-erc20', symbol: 'USDC', name: 'USDC ERC20', network: 'ethereum', icon: 'U', available: true },
  { id: 'usdc-bep20', symbol: 'USDC', name: 'USDC BEP20', network: 'bsc', icon: 'U', available: true },
  { id: 'usdc-polygon', symbol: 'USDC', name: 'USDC POLYGON', network: 'polygon', icon: 'U', available: true },
  { id: 'usdc-sol', symbol: 'USDC', name: 'USDC SOL', network: 'solana', icon: 'U', available: true },
  { id: 'usdc-arb1', symbol: 'USDC', name: 'USDC ARB1', network: 'arbitrum', icon: 'U', available: true },
  { id: 'usdc-avaxc', symbol: 'USDC', name: 'USDC AVAXC', network: 'avax', icon: 'U', available: true },

  // 8. TRON (TRX)
  { id: 'trx', symbol: 'TRX', name: 'TRON TRX', network: 'tron', icon: 'T', available: true },

  // 9. Lido Staked Ether (STETH)
  { id: 'steth', symbol: 'STETH', name: 'Lido Staked Ether STETH', network: 'ethereum', icon: 'L', available: true },

  // 10. Dogecoin (DOGE)
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin DOGE', network: 'dogecoin', icon: 'Ð', available: true },

  // 11. Figure Heloc (FIGR_HELOC)
  { id: 'figr-heloc', symbol: 'FIGR_HELOC', name: 'Figure Heloc FIGR_HELOC', network: 'ethereum', icon: 'F', available: true },

  // 12. Cardano (ADA)
  { id: 'ada', symbol: 'ADA', name: 'Cardano ADA', network: 'cardano', icon: 'A', available: true },

  // 13. Wrapped stETH (WSTETH)
  { id: 'wsteth', symbol: 'WSTETH', name: 'Wrapped stETH WSTETH', network: 'ethereum', icon: 'W', available: true },

  // 14. Monero (XMR)
  { id: 'xmr', symbol: 'XMR', name: 'Monero XMR', network: 'monero', icon: 'M', available: true },

  // 15. WhiteBIT Coin (WBT)
  { id: 'wbt', symbol: 'WBT', name: 'WhiteBIT Coin WBT', network: 'ethereum', icon: 'W', available: true },

  // 16. Wrapped Beacon ETH (WBETH)
  { id: 'wbeth', symbol: 'WBETH', name: 'Wrapped Beacon ETH WBETH', network: 'ethereum', icon: 'W', available: true },

  // 17. Wrapped Bitcoin (WBTC)
  { id: 'wbtc-erc20', symbol: 'WBTC', name: 'Wrapped Bitcoin WBTC ERC20', network: 'ethereum', icon: 'W', available: true },
  { id: 'wbtc-bep20', symbol: 'WBTC', name: 'Wrapped Bitcoin WBTC BEP20', network: 'bsc', icon: 'W', available: true },

  // 18. Bitcoin Cash (BCH)
  { id: 'bch', symbol: 'BCH', name: 'Bitcoin Cash BCH', network: 'bitcoincash', icon: 'B', available: true },

  // 19. Wrapped eETH (WEETH)
  { id: 'weeth', symbol: 'WEETH', name: 'Wrapped eETH WEETH', network: 'ethereum', icon: 'W', available: true },

  // 20. USDS
  { id: 'usds-erc20', symbol: 'USDS', name: 'USDS ERC20', network: 'ethereum', icon: 'U', available: true },

  // 21. Chainlink (LINK)
  { id: 'link-erc20', symbol: 'LINK', name: 'Chainlink LINK ERC20', network: 'ethereum', icon: 'L', available: true },
  { id: 'link-bep20', symbol: 'LINK', name: 'Chainlink LINK BEP20', network: 'bsc', icon: 'L', available: true },

  // 22. Binance Bridged USDT (BSC-USD)
  { id: 'bsc-usd', symbol: 'BSC-USD', name: 'Binance Bridged USDT BSC-USD', network: 'bsc', icon: 'B', available: true },

  // 23. LEO Token (LEO)
  { id: 'leo', symbol: 'LEO', name: 'LEO Token LEO', network: 'ethereum', icon: 'L', available: true },

  // 24. WETH
  { id: 'weth-erc20', symbol: 'WETH', name: 'WETH ERC20', network: 'ethereum', icon: 'W', available: true },
  { id: 'weth-bep20', symbol: 'WETH', name: 'WETH BEP20', network: 'bsc', icon: 'W', available: true },
  { id: 'weth-polygon', symbol: 'WETH', name: 'WETH POLYGON', network: 'polygon', icon: 'W', available: true },
  { id: 'weth-arb1', symbol: 'WETH', name: 'WETH ARB1', network: 'arbitrum', icon: 'W', available: true },

  // 25. Stellar (XLM)
  { id: 'xlm', symbol: 'XLM', name: 'Stellar XLM', network: 'stellar', icon: 'X', available: true },

  // 26. Coinbase Wrapped BTC (CBBTC)
  { id: 'cbbtc', symbol: 'CBBTC', name: 'Coinbase Wrapped BTC CBBTC', network: 'ethereum', icon: 'C', available: true },

  // 27. Zcash (ZFC)
  { id: 'zfc', symbol: 'ZFC', name: 'Zcash ZFC', network: 'zcash', icon: 'Z', available: true },

  // 28. Sui (SUI)
  { id: 'sui', symbol: 'SUI', name: 'Sui SUI', network: 'sui', icon: 'S', available: true },

  // 29. Ethena USDe (USDE)
  { id: 'usde', symbol: 'USDE', name: 'Ethena USDe USDE', network: 'ethereum', icon: 'U', available: true },

  // 30. Avalanche (AVAX)
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche AVAX', network: 'avax', icon: 'A', available: true },

  // Additional popular tokens
  { id: 'dai-erc20', symbol: 'DAI', name: 'DAI ERC20', network: 'ethereum', icon: 'D', available: true },
  { id: 'dai-bep20', symbol: 'DAI', name: 'DAI BEP20', network: 'bsc', icon: 'D', available: true },
  { id: 'dai-arb1', symbol: 'DAI', name: 'DAI ARB1', network: 'arbitrum', icon: 'D', available: true },
]

interface InvoiceCreatorProps {
  onCreateInvoice: (invoiceData: {
    invoiceId?: string
    email: string
    amount: number
    currency: CryptoCurrency
    paymentAddress?: string
    memo?: string
    qrCode?: string
    expiresAt?: string
  }) => void
}

function InvoiceCreator({ onCreateInvoice }: InvoiceCreatorProps) {
  const { t, language, setLanguage } = useLanguage()
  const user = getCurrentUser()
  const [email, setEmail] = useState(user?.email || user?.nickname || '')
  const [amount, setAmount] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const filteredCryptos = useMemo(() => {
    let filtered = cryptocurrencies

    // Filter by network
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter((crypto) => crypto.network === selectedNetwork)
    }

    return filtered
  }, [selectedNetwork])

  const handleContinue = async () => {
    if (!email.trim()) {
      setAlertMessage('Пожалуйста, введите ник')
      return
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setAlertMessage('Пожалуйста, введите корректную сумму')
      return
    }

    if (!selectedCrypto) {
      setAlertMessage('Пожалуйста, выберите криптовалюту')
      return
    }

    try {
      // Отправляем запрос на сервер
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: email.trim(),
          amount: parseFloat(amount),
          currency: selectedCrypto.symbol,
          network: selectedCrypto.network,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setAlertMessage('Ошибка создания счета: ' + result.error)
        return
      }

      // Передаем данные счета родительскому компоненту
      onCreateInvoice({
        invoiceId: result.data.id,
        email: email.trim(),
        amount: parseFloat(result.data.amount), // Используем сумму из ответа сервера (в крипте)
        currency: selectedCrypto,
        paymentAddress: result.data.paymentAddress,
        memo: result.data.memo,
        qrCode: result.data.qrCode,
        expiresAt: result.data.expiresAt,
      })
    } catch (error) {
      console.error('Failed to create invoice:', error)
      setAlertMessage('Ошибка подключения к серверу')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
        {/* Nickname Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">{t('enter_nickname')}</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={user?.nickname || t('nickname_placeholder')}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">{t('enter_amount')}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm text-gray-300">{t('select_network')}</label>
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </div>
          <div className="flex flex-wrap gap-2">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => {
                  setSelectedNetwork(network.id)
                  setSelectedCrypto(null) // Reset selection when network changes
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${selectedNetwork === network.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-[#0a0a0a] text-gray-300 border border-[#2a2a2a] hover:border-orange-500/50 hover:text-orange-400'
                  }`}
              >
                {network.label}
              </button>
            ))}
          </div>
        </div>

        {/* Crypto Selection */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-3">{t('select_crypto')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-2">
            {filteredCryptos.map((crypto) => (
              <button
                key={crypto.id}
                onClick={() => setSelectedCrypto(crypto)}
                disabled={!crypto.available}
                className={`p-3 rounded-lg border transition-all text-left hover:scale-105 ${selectedCrypto?.id === crypto.id
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-orange-500/50'
                  } ${!crypto.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <CryptoIcon symbol={crypto.symbol} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{crypto.symbol}</div>
                    <div className="text-xs text-gray-400 truncate">{crypto.network.toUpperCase()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filteredCryptos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {t('cryptos_not_found')}
            </div>
          )}
        </div>

        {/* Footer with Language and Continue Button */}
        <div className="flex items-center justify-between pt-6 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
              className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </div>
          <button
            onClick={handleContinue}
            disabled={!email || !amount || !selectedCrypto}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('continue')}
          </button>
        </div>
      </div>
      {alertMessage && <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />}
    </div>
  )
}

export default InvoiceCreator
