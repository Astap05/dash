import { useState, useEffect, useMemo } from 'react'
import { Copy, Check, AlertCircle, Wallet, Waves } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useWalletContext } from '../contexts/WalletContext'

interface InvoicePaymentPageProps {
  invoiceData: {
    email: string
    amount: number
    currency: {
      id: string
      symbol: string
      name: string
      network: string
      icon: string
    }
  }
  onBack: () => void
}

function InvoicePaymentPage({ invoiceData, onBack }: InvoicePaymentPageProps) {
  // ДОБАВИЛИ isConnected и address СЮДА
  const { connectWallet, isConnected, address } = useWalletContext()
  
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds

  // Generate a mock wallet address (in real app, this would come from backend)
  const walletAddress = useMemo(() => {
    // Generate a random Ethereum-style address
    const chars = '0123456789abcdef'
    return '0x' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }, [])

  // Calculate crypto amount (simplified - in real app would use exchange rate)
  const cryptoAmount = useMemo(() => {
    // Placeholder calculation - would use actual exchange rate
    return (invoiceData.amount * 1.01).toFixed(4) // Add small fee
  }, [invoiceData.amount])

  // QR Code data
  const qrCodeData = useMemo(() => {
    return `${walletAddress}?amount=${cryptoAmount}`
  }, [walletAddress, cryptoAmount])

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

  const handleConnectMetaMask = async () => {
    if (!isConnected) {
       await connectWallet()
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
          <h2 className="text-2xl font-bold mb-2">OX processing</h2>
          <h3 className="text-lg text-gray-300 mb-4">
            Send {invoiceData.currency.symbol} to the wallet address by copying it or scan the following QR code:
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Instructions */}
          <div className="space-y-6">
            {/* Step 1: Coin Ticker */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">Step 1: Check coin ticker</span>
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
                <span className="text-sm text-gray-400">Step 2: Check the total in {invoiceData.currency.symbol}</span>
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
                <span className="text-sm text-gray-400">Step 3: Send the above amount to this wallet address</span>
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

            {/* Warning Box */}
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300 space-y-2">
                  <p className="font-semibold">Please take into account the commission for sending!</p>
                  <p>
                    The amount is specified without the commission of the service you are going to use for the transfer.
                    OXprocessing must receive the exact amount specified in the payment form. If the amount received
                    differs even by one digit, the payment can be credited only through the technical support service.
                  </p>
                </div>
              </div>
            </div>

            {/* Web3 Wallet Buttons */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Or pay with Web3 wallet</p>
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* ВОТ ТУТ ГЛАВНОЕ ИЗМЕНЕНИЕ: Условие для кнопки MetaMask */}
                {isConnected && address ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg cursor-default opacity-90"
                  >
                    <Check className="w-5 h-5" />
                    Connected: {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectMetaMask}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#f6851b] hover:bg-[#e2761b] text-white font-semibold rounded-lg transition-colors"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect MetaMask
                  </button>
                )}

                <button
                  disabled
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Waves className="w-5 h-5" />
                  WalletConnect
                </button>
              </div>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex flex-col items-center justify-start">
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCodeSVG value={qrCodeData} size={200} level="H" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">The address is valid for the specified period only:</p>
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
                <p className="font-semibold">Attention!</p>
                <p>
                  After sending {invoiceData.currency.symbol} ({invoiceData.currency.network.toUpperCase()}),
                  wait for 3 confirmation of the transaction, after which the funds will be credited to your account.
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
            Назад
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoicePaymentPage