import { useState, useEffect, useMemo } from 'react'
import { Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLanguage } from '../contexts/LanguageContext'

interface InvoicePaymentPageProps {
  invoiceData: {
    invoiceId?: string
    email: string
    amount: number
    currency: {
      id: string
      symbol: string
      name: string
      network: string
      icon: string
    }
    paymentAddress?: string
    memo?: string
    qrCode?: string
    expiresAt?: string
  }
  onBack: () => void
}

function InvoicePaymentPage({ invoiceData, onBack }: InvoicePaymentPageProps) {
  const { t } = useLanguage()


  const [copiedAmount, setCopiedAmount] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (invoiceData.expiresAt) {
      const expires = new Date(invoiceData.expiresAt).getTime()
      const now = Date.now()
      return Math.max(0, Math.floor((expires - now) / 1000))
    }
    return 30 * 60
  })

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | 'error'>('pending')

  const checkPaymentStatus = async () => {
    if (!invoiceData.invoiceId) return

    try {
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceData.invoiceId}`)
      const data = await response.json()

      if (data.success) {
        const newStatus = data.data.status
        if (newStatus === 'paid' || newStatus === 'confirmed') {
          setPaymentStatus('paid')
          setShowSuccessModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  useEffect(() => {
    if (paymentStatus === 'paid') return

    const interval = setInterval(checkPaymentStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [invoiceData.invoiceId, paymentStatus])

  const walletAddress = invoiceData.paymentAddress || ''
  const cryptoAmount = useMemo(() => {
    const num = Number(invoiceData.amount)
    return invoiceData.currency.network === 'ripple' ? num.toFixed(6) : num.toString()
  }, [invoiceData.amount, invoiceData.currency.network])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Generate Payment URI
  const paymentUri = useMemo(() => {
    const network = invoiceData.currency.network.toLowerCase()
    const amount = cryptoAmount

    switch (network) {
      case 'ripple':
        // Classic ripple: URI is still the most compatible for Xaman/Xumm
        // Format: ripple:address?amount=...
        const roundedAmount = parseFloat(parseFloat(amount).toFixed(6))
        if (!walletAddress) return ''
        return `ripple:${walletAddress}?amount=${roundedAmount}${invoiceData.memo ? `&dt=${invoiceData.memo}` : ''}`
      case 'ton':
        const nanotons = Math.floor(parseFloat(amount) * 1e9)
        return `ton://transfer/${walletAddress}?amount=${nanotons}${invoiceData.memo ? `&text=${invoiceData.memo}` : ''}`
      case 'solana':
        return `solana:${walletAddress}?amount=${amount}${invoiceData.memo ? `&memo=${invoiceData.memo}` : ''}`
      case 'bitcoin':
        return `bitcoin:${walletAddress}?amount=${amount}`
      case 'stellar':
        return `stellar:${walletAddress}?amount=${amount}${invoiceData.memo ? `&memo=${invoiceData.memo}` : ''}`
      default:
        return `${network}:${walletAddress}?amount=${amount}`
    }
  }, [invoiceData.currency.network, walletAddress, cryptoAmount, invoiceData.memo])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('processing')}</h2>
          <h3 className="text-lg text-gray-300">
            {t('send_to_wallet')} {invoiceData.currency.symbol}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Amount */}
            <div>
              <span className="text-sm text-gray-400 block mb-2">{t('check_total')} {invoiceData.currency.symbol}</span>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <span className="text-white font-semibold text-lg">{cryptoAmount} {invoiceData.currency.symbol}</span>
                <button onClick={() => handleCopy(cryptoAmount, setCopiedAmount)} className="ml-auto p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                  {copiedAmount ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Address */}
            <div>
              <span className="text-sm text-gray-400 block mb-2">{t('send_amount_to')}</span>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <span className="text-white font-mono text-sm break-all flex-1">{walletAddress}</span>
                <button onClick={() => handleCopy(walletAddress, setCopiedAddress)} className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                  {copiedAddress ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Memo/Tag */}
            {invoiceData.memo && (
              <div>
                <span className="text-sm text-gray-400 block mb-2">
                  {invoiceData.currency.network === 'ripple' ? 'Destination Tag' : 'Memo'} (ОБЯЗАТЕЛЬНО)
                </span>
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <span className="text-white font-mono text-sm flex-1">{invoiceData.memo}</span>
                  <button onClick={() => handleCopy(invoiceData.memo!, setCopiedMemo)} className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                    {copiedMemo ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                <p className="text-xs text-yellow-400 mt-1">⚠️ Без указания тега средства будут утеряны!</p>
              </div>
            )}

            {/* Open in Wallet Button (Mobile) */}
            <a
              href={paymentUri}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all lg:hidden"
            >
              <ExternalLink className="w-5 h-5" />
              Открыть в кошельке
            </a>

            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-semibold">{t('commission_warning')}</p>
                  <p>{t('commission_text')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4 shadow-xl">
              <QRCodeSVG value={paymentUri} size={220} level="H" includeMargin={true} />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Оплатите в течение:</p>
              <div className="text-3xl font-bold text-red-500 font-mono">{formatTime(timeLeft)}</div>

            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#2a2a2a] flex justify-between items-center">
          <button onClick={onBack} className="px-6 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors">
            {t('back')}
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Ожидание оплаты в сети {invoiceData.currency.network.toUpperCase()}...
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-green-500/30 max-w-md w-full mx-4 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Оплата получена!</h3>
              <p className="text-gray-400 mb-8">Ваш заказ успешно оплачен и обрабатывается.</p>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02]"
              >
                Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicePaymentPage