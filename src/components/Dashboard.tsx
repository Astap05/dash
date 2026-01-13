import { useState, useEffect } from 'react'
import Header from './Header'
import InvoiceCreator from './InvoiceCreator'
import InvoicePaymentPage from './InvoicePaymentPage'

interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  network: string
  icon: string
  available: boolean
}

interface InvoiceData {
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

// Available cryptocurrencies (same as in InvoiceCreator)
const cryptocurrencies: CryptoCurrency[] = [
  // USDT variants
  { id: 'usdt-arb1', symbol: 'USDT', name: 'T USDT ARB1', network: 'arbitrum', icon: 'T', available: true },
  { id: 'usdt-trc20', symbol: 'USDT', name: 'T USDT TRC20', network: 'tron', icon: 'T', available: true },
  { id: 'usdt-sol', symbol: 'USDT', name: 'T USDT SOL', network: 'solana', icon: 'T', available: true },
  { id: 'usdt-polygon', symbol: 'USDT', name: 'T USDT POLYGON', network: 'polygon', icon: 'T', available: true },
  { id: 'usdt-avaxc', symbol: 'USDT', name: 'T USDT AVAXC', network: 'avax', icon: 'T', available: true },
  { id: 'usdt-erc20', symbol: 'USDT', name: 'T USDT ERC20', network: 'ethereum', icon: 'T', available: true },
  { id: 'usdt-bep20', symbol: 'USDT', name: 'T USDT BEP20', network: 'bsc', icon: 'T', available: true },
  // Native cryptocurrencies
  { id: 'sol', symbol: 'SOL', name: 'SOL', network: 'solana', icon: 'SOL', available: true },
  // Other cryptocurrencies
  { id: 'btc', symbol: 'BTC', name: 'B BTC BITCOIN', network: 'bitcoin', icon: 'B', available: true },
  { id: 'dai-bep20', symbol: 'DAI', name: '# DAI BEP20', network: 'bsc', icon: '#', available: true },
  { id: 'dai-arb1', symbol: 'DAI', name: 'DAI ARB1', network: 'arbitrum', icon: 'DAI', available: true },
  { id: 'dai-erc20', symbol: 'DAI', name: 'DAI ERC20', network: 'ethereum', icon: 'DAI', available: true },
  { id: 'axs-erc20', symbol: 'AXS', name: 'AXS ERC20', network: 'ethereum', icon: 'AXS', available: true },
]

function Dashboard() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

  // Helper function to find currency by symbol and network
  const findCurrency = (symbol: string, network: string): CryptoCurrency | null => {
    // First try exact match
    let currency = cryptocurrencies.find(crypto =>
      crypto.symbol === symbol && crypto.network === network
    )

    // If not found, try to find any currency with matching symbol on the network
    if (!currency) {
      currency = cryptocurrencies.find(crypto =>
        crypto.symbol === symbol && crypto.network === network
      )
    }

    // If still not found, return a default currency object
    if (!currency) {
      currency = {
        id: symbol.toLowerCase(),
        symbol: symbol,
        name: symbol,
        network: network,
        icon: symbol.charAt(0),
        available: true
      }
    }

    return currency
  }

  // Load invoice data from database on component mount
  useEffect(() => {
    // Сначала попробовать загрузить из localStorage
    const savedInvoiceData = localStorage.getItem('currentInvoiceData')
    if (savedInvoiceData) {
      try {
        const parsedData = JSON.parse(savedInvoiceData)
        // Проверить, не истек ли инвойс
        if (parsedData.expiresAt && new Date(parsedData.expiresAt) > new Date()) {
          setInvoiceData(parsedData)
        } else {
          // Если истек, очистить
          localStorage.removeItem('currentInvoiceData')
          localStorage.removeItem('currentInvoiceId')
          return
        }
      } catch (error) {
        console.error('Failed to parse saved invoice data:', error)
        localStorage.removeItem('currentInvoiceData')
      }
    }

    // Затем попытаться обновить с сервера, если есть ID
    const savedInvoiceId = localStorage.getItem('currentInvoiceId')
    if (savedInvoiceId) {
      fetch(`http://localhost:3001/api/invoices/${savedInvoiceId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data.status === 'pending') {
            const invoice = data.data
            const currency = findCurrency(invoice.currency, invoice.network)
            if (currency) {
              const updatedInvoiceData: InvoiceData = {
                invoiceId: invoice.id,
                email: invoice.nickname,
                amount: parseFloat(invoice.amount),
                currency: currency,
                paymentAddress: invoice.payment_address,
                memo: invoice.memo,
                qrCode: invoice.qr_code,
                expiresAt: invoice.expires_at
              }
              // Обновлять только если ключевые поля заполнены
              if (updatedInvoiceData.paymentAddress && updatedInvoiceData.qrCode && updatedInvoiceData.expiresAt) {
                setInvoiceData(updatedInvoiceData)
                // Обновить localStorage новыми данными
                localStorage.setItem('currentInvoiceData', JSON.stringify(updatedInvoiceData))
              } else {
                // Если поля пустые, не обновлять, использовать cached
                console.log('Server data incomplete, using cached data')
              }
            }
          } else {
            // Если статус не pending, очистить
            localStorage.removeItem('currentInvoiceData')
            localStorage.removeItem('currentInvoiceId')
            setInvoiceData(null)
          }
        })
        .catch(error => {
          console.error('Failed to update invoice data from server:', error)
          // Не очищать localStorage, использовать cached данные
        })
    }
  }, [])

  const handleCreateInvoice = (data: InvoiceData) => {
    setInvoiceData(data)
    // Сохранять полный invoiceData в localStorage
    localStorage.setItem('currentInvoiceData', JSON.stringify(data))
    // Сохранять ID для совместимости (если нужно для сервера)
    if (data.invoiceId) {
      localStorage.setItem('currentInvoiceId', data.invoiceId)
    }
  }

  const handleBack = () => {
    setInvoiceData(null)
    localStorage.removeItem('currentInvoiceData')
    localStorage.removeItem('currentInvoiceId')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6">
        <Header />
        
        <div className="mt-8">
          {invoiceData ? (
            <InvoicePaymentPage invoiceData={invoiceData} onBack={handleBack} />
          ) : (
            <InvoiceCreator onCreateInvoice={handleCreateInvoice} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
