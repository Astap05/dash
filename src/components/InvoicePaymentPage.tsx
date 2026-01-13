import { useState, useEffect, useMemo } from 'react'
import { Copy, Check, AlertCircle, Wallet, Waves } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useWalletContext } from '../contexts/WalletContext'
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
  // ДОБАВИЛИ isConnected и address СЮДА
  const { connectWallet, connectWalletConnect, isConnected, address, walletType } = useWalletContext()

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
    return 30 * 60 // 30 minutes default
  })

  // Payment status checking
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | 'error'>('pending')

  const checkPaymentStatus = async () => {
    if (!invoiceData.invoiceId) return

    try {
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceData.invoiceId}`)
      const data = await response.json()

      if (data.success) {
        const newStatus = data.data.status
        if (newStatus !== paymentStatus) {
          setPaymentStatus(newStatus)

          if (newStatus === 'paid') {
            // Show success modal
            setShowSuccessModal(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      setPaymentStatus('error')
    }
  }

  // Check payment status every 10 seconds (to avoid rate limiting)
  useEffect(() => {
    if (paymentStatus === 'paid') return // Stop checking if already paid

    // Wait 2 seconds before first check, then check every 10 seconds
    const timeout = setTimeout(() => {
      checkPaymentStatus() // First check
      const interval = setInterval(checkPaymentStatus, 10000) // Then every 10 seconds
      return () => clearInterval(interval)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [invoiceData.invoiceId, paymentStatus])

  // Use real data from invoice
  const walletAddress = invoiceData.paymentAddress || '0x0000000000000000000000000000000000000000'
  const qrCodeData = invoiceData.qrCode

  // Calculate crypto amount (simplified - in real app would use exchange rate)
  const cryptoAmount = useMemo(() => {
    // Placeholder calculation - would use actual exchange rate
    return (invoiceData.amount * 1.01).toFixed(4) // Add small fee
  }, [invoiceData.amount])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(`${cryptoAmount} ${invoiceData.currency.symbol}`)
      setCopiedAmount(true)
      setTimeout(() => setCopiedAmount(false), 2000)
    } catch (err) {
      console.error('Failed to copy amount:', err)
    }
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleCopyMemo = async () => {
    try {
      await navigator.clipboard.writeText(invoiceData.memo || '')
      setCopiedMemo(true)
      setTimeout(() => setCopiedMemo(false), 2000)
    } catch (err) {
      console.error('Failed to copy memo:', err)
    }
  }

  const handleConnectMetaMask = async () => {
    if (!isConnected) {
       await connectWallet()
    }
  }

  const handleConnectWalletConnect = async () => {
    if (!isConnected) {
       await connectWalletConnect()
    }
  }

  // Функция для сокращения адреса (чтобы красиво отображать на кнопке)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('processing')}</h2>
          <h3 className="text-lg text-gray-300 mb-4">
            {t('send_to_wallet')} {invoiceData.currency.symbol}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Instructions */}
          <div className="space-y-6">
            {/* Step 1: Coin Ticker */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">{t('check_coin_ticker')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                  {invoiceData.currency.icon || invoiceData.currency.symbol.charAt(0)}
                </div>
                <span className="text-white font-medium">{invoiceData.currency.name}</span>
              </div>
            </div>

            {/* Step 2: Total Amount */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">{t('check_total')} {invoiceData.currency.symbol}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <span className="text-white font-semibold text-lg">{cryptoAmount} {invoiceData.currency.symbol}</span>
                <button
                  onClick={handleCopyAmount}
                  className="ml-auto p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  title="Copy amount"
                >
                  {copiedAmount ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Step 3: Wallet Address */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">{t('send_amount_to')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <span className="text-white font-mono text-sm break-all flex-1">{walletAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Step 4: Memo (for Solana) */}
            {invoiceData.memo && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400">Memo (обязательно для Solana)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <span className="text-white font-mono text-sm break-all flex-1">{invoiceData.memo}</span>
                  <button
                    onClick={handleCopyMemo}
                    className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors flex-shrink-0"
                    title="Copy memo"
                  >
                    {copiedMemo ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Важно: Укажите этот memo при переводе в Trust Wallet или другом кошельке
                </p>
              </div>
            )}

            {/* Warning Box */}
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300 space-y-2">
                  <p className="font-semibold">{t('commission_warning')}</p>
                  <p>
                    {t('commission_text')}
                  </p>
                </div>
              </div>
            </div>

            {/* Web3 Wallet Buttons */}
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('pay_with_web3')}</p>
              <div className="flex flex-col sm:flex-row gap-3">

                {/* MetaMask button */}
                {walletType === 'metamask' && isConnected && address ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg cursor-default opacity-90"
                  >
                    <Check className="w-5 h-5" />
                    MetaMask: {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectMetaMask}
                    disabled={isConnected}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#f6851b] hover:bg-[#e2761b] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wallet className="w-5 h-5" />
                    {t('connect_metamask')}
                  </button>
                )}

                {/* WalletConnect button */}
                {walletType === 'walletconnect' && isConnected && address ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg cursor-default opacity-90"
                  >
                    <Check className="w-5 h-5" />
                    WalletConnect: {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectWalletConnect}
                    disabled={isConnected}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Waves className="w-5 h-5" />
                    {t('walletconnect')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex flex-col items-center justify-start">
            <div className="bg-white p-4 rounded-lg mb-4">
              {qrCodeData ? (
                <img src={qrCodeData} alt="QR Code" className="w-48 h-48" />
              ) : (
                invoiceData.currency.network === 'solana' ? (
                  <QRCodeSVG value={`solana:${walletAddress}?amount=${cryptoAmount}${invoiceData.memo ? `&memo=${invoiceData.memo}` : ''}`} size={200} level="H" />
                ) : (
                  <QRCodeSVG value={`ethereum:${walletAddress}?amount=${cryptoAmount}`} size={200} level="H" />
                )
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Адрес действителен только в указанный период:</p>
              <div className="text-2xl font-bold text-red-400 font-mono">{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>

        {/* Bottom Warning */}
        <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-semibold">{t('attention')}</p>
                <p>
                  {t('confirmation_text').replace('{symbol}', invoiceData.currency.symbol).replace('{network}', invoiceData.currency.network.toUpperCase())}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] max-w-md w-full mx-4">
            <div className="text-center">
              {/* Green Checkmark */}
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-white mb-2">
                🎉 Оплата успешна!
              </h3>
              <p className="text-gray-300 mb-6">
                Спасибо за покупку. Ваша транзакция подтверждена.
              </p>

              {/* OK Button */}
              <button
                onClick={() => {
                  // Clear stored invoice data
                  localStorage.removeItem('currentInvoiceId')
                  localStorage.removeItem('currentInvoiceData')
                  window.location.href = '/'
                }}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicePaymentPage