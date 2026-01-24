import { useState, useEffect } from 'react'
import Header from './Header'
import InvoiceCreator from './InvoiceCreator'
import InvoicePaymentPage from './InvoicePaymentPage'
import AdminDashboard from './AdminDashboard'

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

  // Check if admin mode
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true'

  if (isAdmin) {
    return <AdminDashboard />
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
