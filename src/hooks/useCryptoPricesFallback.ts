import { useState, useEffect, useRef } from 'react'
import { CryptoPrice } from '../services/cryptoService'

// Fallback через REST API если WebSocket не работает
export function useCryptoPricesFallback(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [isUsingDemo, setIsUsingDemo] = useState(false)
  const isUsingDemoRef = useRef(false)

  useEffect(() => {
    // Демонстрационные цены (fallback если API недоступен)
    const getDemoPrices = (): Map<string, CryptoPrice> => {
      const demoPrices: Record<string, { price: number; change: number }> = {
        BTC: { price: 43000 + Math.random() * 2000, change: (Math.random() - 0.5) * 5 },
        ETH: { price: 2500 + Math.random() * 200, change: (Math.random() - 0.5) * 5 },
        BNB: { price: 300 + Math.random() * 20, change: (Math.random() - 0.5) * 5 },
        SOL: { price: 100 + Math.random() * 10, change: (Math.random() - 0.5) * 5 },
        MATIC: { price: 0.8 + Math.random() * 0.2, change: (Math.random() - 0.5) * 5 },
        LINK: { price: 15 + Math.random() * 2, change: (Math.random() - 0.5) * 5 },
        UNI: { price: 6 + Math.random() * 1, change: (Math.random() - 0.5) * 5 },
        AAVE: { price: 90 + Math.random() * 10, change: (Math.random() - 0.5) * 5 },
        XRP: { price: 0.6 + Math.random() * 0.1, change: (Math.random() - 0.5) * 5 },
        ADA: { price: 0.5 + Math.random() * 0.1, change: (Math.random() - 0.5) * 5 },
        AVAX: { price: 35 + Math.random() * 5, change: (Math.random() - 0.5) * 5 },
        DOT: { price: 7 + Math.random() * 1, change: (Math.random() - 0.5) * 5 },
        ATOM: { price: 10 + Math.random() * 2, change: (Math.random() - 0.5) * 5 },
        LTC: { price: 70 + Math.random() * 10, change: (Math.random() - 0.5) * 5 },
        BCH: { price: 250 + Math.random() * 30, change: (Math.random() - 0.5) * 5 },
        XLM: { price: 0.12 + Math.random() * 0.02, change: (Math.random() - 0.5) * 5 },
        ALGO: { price: 0.2 + Math.random() * 0.05, change: (Math.random() - 0.5) * 5 },
        FIL: { price: 5 + Math.random() * 1, change: (Math.random() - 0.5) * 5 },
      }

      const newPrices = new Map<string, CryptoPrice>()
      symbols.forEach((symbol) => {
        const demo = demoPrices[symbol.toUpperCase()]
        if (demo) {
          newPrices.set(symbol, {
            symbol,
            price: demo.price,
            change24h: demo.change,
            volume24h: 0,
          })
        }
      })
      return newPrices
    }

    const fetchPrices = async () => {
      // Используем CoinGecko API
      const coinIds = getCoinGeckoIds(symbols)
      if (!coinIds) {
        // Если нет ID для CoinGecko, используем демо-данные
        setPrices(getDemoPrices())
        isUsingDemoRef.current = true
        setIsUsingDemo(true)
        setIsConnected(true)
        return
      }

      try {

        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        )
        
        if (!response.ok) {
          if (response.status === 429) {
            console.warn('CoinGecko rate limit, retrying with delay...')
            // Ждем и повторяем запрос
            await new Promise(resolve => setTimeout(resolve, 5000))
            const retryResponse = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
              {
                headers: {
                  'Accept': 'application/json',
                },
              }
            )
            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              const retryPrices = new Map<string, CryptoPrice>()
              Object.entries(retryData).forEach(([id, priceData]: [string, any]) => {
                const symbol = getSymbolFromCoinGeckoId(id)
                if (symbol && symbols.includes(symbol)) {
                  retryPrices.set(symbol, {
                    symbol,
                    price: priceData.usd || 0,
                    change24h: priceData.usd_24h_change || 0,
                    volume24h: 0,
                  })
                }
              })
              symbols.forEach((symbol) => {
                if (!retryPrices.has(symbol)) {
                  const demo = getDemoPrices().get(symbol)
                  if (demo) {
                    retryPrices.set(symbol, demo)
                  }
                }
              })
              setPrices(retryPrices)
              isUsingDemoRef.current = false
              setIsUsingDemo(false)
              setIsConnected(true)
              return
            }
            // Если повторная попытка не удалась, используем демо-данные
            console.warn('CoinGecko still rate limited, using demo data')
            setPrices(getDemoPrices())
            isUsingDemoRef.current = true
            setIsUsingDemo(true)
            setIsConnected(true)
            return
          }
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const newPrices = new Map<string, CryptoPrice>()

        // Маппинг CoinGecko данных
        Object.entries(data).forEach(([id, priceData]: [string, any]) => {
          const symbol = getSymbolFromCoinGeckoId(id)
          if (symbol && symbols.includes(symbol)) {
            newPrices.set(symbol, {
              symbol,
              price: priceData.usd || 0,
              change24h: priceData.usd_24h_change || 0,
              volume24h: 0,
            })
          }
        })

        // Заполняем недостающие символы демо-данными
        symbols.forEach((symbol) => {
          if (!newPrices.has(symbol)) {
            const demo = getDemoPrices().get(symbol)
            if (demo) {
              newPrices.set(symbol, demo)
            }
          }
        })

        setPrices(newPrices)
        isUsingDemoRef.current = false
        setIsUsingDemo(false)
        setIsConnected(true)
      } catch (error) {
        console.warn('Error fetching prices from API, retrying...', error)
        // Пробуем еще раз через 3 секунды
        setTimeout(async () => {
          try {
            const retryResponse = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
              {
                headers: {
                  'Accept': 'application/json',
                },
              }
            )
            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              const retryPrices = new Map<string, CryptoPrice>()
              Object.entries(retryData).forEach(([id, priceData]: [string, any]) => {
                const symbol = getSymbolFromCoinGeckoId(id)
                if (symbol && symbols.includes(symbol)) {
                  retryPrices.set(symbol, {
                    symbol,
                    price: priceData.usd || 0,
                    change24h: priceData.usd_24h_change || 0,
                    volume24h: 0,
                  })
                }
              })
              symbols.forEach((symbol) => {
                if (!retryPrices.has(symbol)) {
                  const demo = getDemoPrices().get(symbol)
                  if (demo) {
                    retryPrices.set(symbol, demo)
                  }
                }
              })
              setPrices(retryPrices)
              isUsingDemoRef.current = false
              setIsUsingDemo(false)
              setIsConnected(true)
              return
            }
          } catch (retryError) {
            console.warn('Retry failed, using demo data')
          }
          // Используем демо-данные только если все попытки не удались
          setPrices(getDemoPrices())
          isUsingDemoRef.current = true
          setIsUsingDemo(true)
          setIsConnected(true)
        }, 3000)
      }
    }

    fetchPrices()
    
    // Обновляем данные каждые 60 секунд (для реальных данных)
    // И каждые 5 секунд для демо-данных (чтобы они выглядели "live")
    const updateInterval = 60000 // 60 секунд для API
    const demoUpdateInterval = 5000 // 5 секунд для демо
    
    const interval = setInterval(() => {
      if (isUsingDemoRef.current) {
        // Если используем демо-данные, обновляем их чаще
        setPrices((prev) => {
          const updated = new Map(prev)
          symbols.forEach((symbol) => {
            const current = updated.get(symbol)
            if (current) {
              updated.set(symbol, {
                ...current,
                price: current.price * (0.995 + Math.random() * 0.01),
                change24h: current.change24h + (Math.random() - 0.5) * 0.5,
              })
            }
          })
          return updated
        })
      } else {
        fetchPrices()
      }
    }, isUsingDemoRef.current ? demoUpdateInterval : updateInterval)

    return () => clearInterval(interval)
  }, [symbols.join(',')])

  return { prices, isConnected, isUsingDemo }
}

function getCoinGeckoIds(symbols: string[]): string {
  const idMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    SOL: 'solana',
    MATIC: 'matic-network',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    XRP: 'ripple',
    ADA: 'cardano',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    ATOM: 'cosmos',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    XLM: 'stellar',
    ALGO: 'algorand',
    FIL: 'filecoin',
  }

  return symbols
    .slice(0, 10)
    .map((s) => idMap[s.toUpperCase()])
    .filter(Boolean)
    .join(',')
}

function getSymbolFromCoinGeckoId(id: string): string | null {
  const reverseMap: Record<string, string> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    binancecoin: 'BNB',
    solana: 'SOL',
    'matic-network': 'MATIC',
    chainlink: 'LINK',
    uniswap: 'UNI',
    aave: 'AAVE',
    ripple: 'XRP',
    cardano: 'ADA',
    'avalanche-2': 'AVAX',
    polkadot: 'DOT',
    cosmos: 'ATOM',
    litecoin: 'LTC',
    'bitcoin-cash': 'BCH',
    stellar: 'XLM',
    algorand: 'ALGO',
    filecoin: 'FIL',
  }

  return reverseMap[id] || null
}

