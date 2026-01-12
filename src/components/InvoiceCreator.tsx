import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { getCurrentUser } from '../services/authService'
import { useLanguage } from '../contexts/LanguageContext'

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
  { id: 'polygon', name: 'Polygon', label: 'Polygon (POLYGON)' },
  { id: 'solana', name: 'Solana', label: 'Solana (SOL)' },
  { id: 'ethereum', name: 'Ethereum', label: 'Ethereum (ERC20)' },
  { id: 'bsc', name: 'BNB Chain', label: 'BNB Chain (BEP20)' },
  { id: 'avax', name: 'AVAX C-Chain', label: 'AVAX C-C' },
]

const cryptocurrencies: CryptoCurrency[] = [
  // USDT variants
  { id: 'usdt-arb1', symbol: 'USDT', name: 'T USDT ARB1', network: 'arbitrum', icon: 'T', available: true },
  { id: 'usdt-trc20', symbol: 'USDT', name: 'T USDT TRC20', network: 'tron', icon: 'T', available: true },
  { id: 'usdt-sol', symbol: 'USDT', name: 'T USDT SOL', network: 'solana', icon: 'T', available: true },
  { id: 'usdt-polygon', symbol: 'USDT', name: 'T USDT POLYGON', network: 'polygon', icon: 'T', available: true },
  { id: 'usdt-avaxc', symbol: 'USDT', name: 'T USDT AVAXC', network: 'avax', icon: 'T', available: true },
  { id: 'usdt-erc20', symbol: 'USDT', name: 'T USDT ERC20', network: 'ethereum', icon: 'T', available: true },
  { id: 'usdt-bep20', symbol: 'USDT', name: 'T USDT BEP20', network: 'bsc', icon: 'T', available: true },
  // Other cryptocurrencies
  { id: 'btc', symbol: 'BTC', name: 'B BTC BITCOIN', network: 'bitcoin', icon: 'B', available: true },
  { id: 'dai-bep20', symbol: 'DAI', name: '# DAI BEP20', network: 'bsc', icon: '#', available: true },
  { id: 'dai-arb1', symbol: 'DAI', name: 'DAI ARB1', network: 'arbitrum', icon: 'DAI', available: true },
  { id: 'dai-erc20', symbol: 'DAI', name: 'DAI ERC20', network: 'ethereum', icon: 'DAI', available: true },
  { id: 'axs-erc20', symbol: 'AXS', name: 'AXS ERC20', network: 'ethereum', icon: 'AXS', available: true },
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

  const filteredCryptos = useMemo(() => {
    let filtered = cryptocurrencies

    // Filter by network
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter((crypto) => {
        const networkMap: Record<string, string> = {
          polygon: 'polygon',
          solana: 'solana',
          ethereum: 'ethereum',
          bsc: 'bsc',
          avax: 'avax',
        }
        return crypto.network === networkMap[selectedNetwork]
      })
    }

    return filtered
  }, [selectedNetwork])

  const handleContinue = async () => {
    if (!email.trim()) {
      alert('Пожалуйста, введите ник')
      return
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму')
      return
    }

    if (!selectedCrypto) {
      alert('Пожалуйста, выберите криптовалюту')
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
        alert('Ошибка создания счета: ' + result.error)
        return
      }

      // Передаем данные счета родительскому компоненту
      onCreateInvoice({
        invoiceId: result.data.id,
        email: email.trim(),
        amount: parseFloat(amount),
        currency: selectedCrypto,
        paymentAddress: result.data.paymentAddress,
        memo: result.data.memo,
        qrCode: result.data.qrCode,
        expiresAt: result.data.expiresAt,
      })
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Ошибка подключения к серверу')
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedNetwork === network.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#0a0a0a] text-gray-300 border border-[#2a2a2a] hover:border-orange-500/50'
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
            {filteredCryptos.map((crypto) => (
              <button
                key={crypto.id}
                onClick={() => setSelectedCrypto(crypto)}
                disabled={!crypto.available}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedCrypto?.id === crypto.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-orange-500/50'
                } ${!crypto.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                    {crypto.icon}
                  </div>
                  <span className="text-xs text-gray-400">{crypto.symbol}</span>
                </div>
                <div className="text-sm text-gray-200 truncate">{crypto.name}</div>
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
    </div>
  )
}

export default InvoiceCreator
