import { useState, useEffect, useRef } from 'react'
import { CryptoPrice } from '../services/cryptoService'

export interface CryptoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  // Курс к нашему токену (заглушка)
  priceInOurToken: number
}

interface UseAllCryptoPricesOptions {
  page?: number
  perPage?: number
  searchQuery?: string
}

export function useAllCryptoPrices(options: UseAllCryptoPricesOptions = {}) {
  const { page = 1, perPage = 100, searchQuery = '' } = options
  const [cryptos, setCryptos] = useState<CryptoMarketData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const isUsingDemoRef = useRef(false)

  // Заглушка для нашего токена
  const OUR_TOKEN_PRICE_USD = 0.1 // Цена нашего токена в USD (заглушка)
  const OUR_TOKEN_SYMBOL = 'OUR' // Символ нашего токена (заглушка)
  const OUR_TOKEN_NAME = 'Our Token' // Название нашего токена (заглушка)

  useEffect(() => {
    const fetchCryptos = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Ограничиваем page до 3, чтобы не превышать лимиты API
        const safePage = Math.min(page, 3)
        
        // Пробуем получить данные из CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${safePage}&sparkline=false&price_change_percentage=24h`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        )

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit - пробуем подождать и повторить один раз
            console.warn('CoinGecko rate limit, waiting and retrying...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const retryResponse = await fetch(
              `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${safePage}&sparkline=false&price_change_percentage=24h`,
              {
                headers: {
                  'Accept': 'application/json',
                },
              }
            )
            
            if (!retryResponse.ok) {
              // Если повторная попытка не удалась, используем демо данные
              console.warn('CoinGecko still rate limited, using demo data')
              isUsingDemoRef.current = true
              setCryptos(generateDemoData())
              setIsLoading(false)
              return
            }
            
            // Используем данные из повторной попытки
            const retryData = await retryResponse.json()
            isUsingDemoRef.current = false
            
            const cryptosWithOurToken: CryptoMarketData[] = retryData.map((coin: any) => ({
              id: coin.id,
              symbol: coin.symbol.toUpperCase(),
              name: coin.name,
              image: coin.image,
              current_price: coin.current_price || 0,
              price_change_percentage_24h: coin.price_change_percentage_24h || 0,
              market_cap: coin.market_cap || 0,
              total_volume: coin.total_volume || 0,
              priceInOurToken: coin.current_price ? coin.current_price / OUR_TOKEN_PRICE_USD : 0,
            }))
            
            let filteredCryptos = cryptosWithOurToken
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase().trim()
              filteredCryptos = cryptosWithOurToken.filter(
                (crypto) =>
                  crypto.name.toLowerCase().includes(query) ||
                  crypto.symbol.toLowerCase().includes(query) ||
                  crypto.id.toLowerCase().includes(query)
              )
            }
            
            setCryptos(filteredCryptos)
            if (searchQuery.trim()) {
              const totalItems = filteredCryptos.length
              setTotalPages(totalItems > 0 ? Math.ceil(totalItems / perPage) : 1)
            } else {
              setTotalPages(3)
            }
            setIsLoading(false)
            return
          }
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        isUsingDemoRef.current = false

        // Преобразуем данные и добавляем курс к нашему токену
        const cryptosWithOurToken: CryptoMarketData[] = data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          current_price: coin.current_price || 0,
          price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          total_volume: coin.total_volume || 0,
          // Рассчитываем курс к нашему токену: цена монеты / цена нашего токена
          priceInOurToken: coin.current_price ? coin.current_price / OUR_TOKEN_PRICE_USD : 0,
        }))

        // Если есть поиск, фильтруем данные
        let filteredCryptos = cryptosWithOurToken
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          filteredCryptos = cryptosWithOurToken.filter(
            (crypto) =>
              crypto.name.toLowerCase().includes(query) ||
              crypto.symbol.toLowerCase().includes(query) ||
              crypto.id.toLowerCase().includes(query)
          )
        }

        setCryptos(filteredCryptos)
        
        // Если есть поиск, рассчитываем страницы на основе отфильтрованных данных
        // Если нет поиска, ограничиваем до 3 страниц (150 монет) для стабильной работы
        if (searchQuery.trim()) {
          const totalItems = filteredCryptos.length
          setTotalPages(totalItems > 0 ? Math.ceil(totalItems / perPage) : 1)
        } else {
          // Ограничиваем до 3 страниц (150 монет) чтобы избежать rate limit
          // Это обеспечит стабильную работу в Live режиме
          setTotalPages(3)
        }
      } catch (err: any) {
        console.warn('Error fetching crypto data, using demo data:', err)
        isUsingDemoRef.current = true
        setCryptos(generateDemoData())
        setError('Используются демонстрационные данные')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptos()

    // Обновляем данные каждые 60 секунд для реальных данных, каждые 5 секунд для демо
    const interval = setInterval(() => {
      if (!isUsingDemoRef.current) {
        fetchCryptos()
      } else {
        setCryptos(generateDemoData())
      }
    }, isUsingDemoRef.current ? 5000 : 60000)

    return () => clearInterval(interval)
  }, [page, perPage, searchQuery, OUR_TOKEN_PRICE_USD])

  // Обновляем totalPages при изменении параметров
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTotalPages(3) // Всегда 3 страницы для основных монет (150 монет)
    }
  }, [searchQuery])

  // Генерация демо данных
  function generateDemoData(): CryptoMarketData[] {
    const demoCryptos = [
      { symbol: 'BTC', name: 'Bitcoin', basePrice: 43000 },
      { symbol: 'ETH', name: 'Ethereum', basePrice: 2500 },
      { symbol: 'BNB', name: 'Binance Coin', basePrice: 300 },
      { symbol: 'SOL', name: 'Solana', basePrice: 100 },
      { symbol: 'XRP', name: 'Ripple', basePrice: 0.6 },
      { symbol: 'ADA', name: 'Cardano', basePrice: 0.5 },
      { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.08 },
      { symbol: 'MATIC', name: 'Polygon', basePrice: 0.8 },
      { symbol: 'DOT', name: 'Polkadot', basePrice: 7 },
      { symbol: 'LINK', name: 'Chainlink', basePrice: 15 },
      { symbol: 'AVAX', name: 'Avalanche', basePrice: 35 },
      { symbol: 'UNI', name: 'Uniswap', basePrice: 6 },
      { symbol: 'ATOM', name: 'Cosmos', basePrice: 10 },
      { symbol: 'LTC', name: 'Litecoin', basePrice: 70 },
      { symbol: 'BCH', name: 'Bitcoin Cash', basePrice: 250 },
    ]

    return demoCryptos.map((crypto) => {
      const priceVariation = 1 + (Math.random() - 0.5) * 0.1 // ±5% вариация
      const currentPrice = crypto.basePrice * priceVariation
      const change24h = (Math.random() - 0.5) * 10 // -5% до +5%

      return {
        id: crypto.symbol.toLowerCase(),
        symbol: crypto.symbol,
        name: crypto.name,
        image: `https://assets.coingecko.com/coins/images/1/small/${crypto.symbol.toLowerCase()}.png`,
        current_price: currentPrice,
        price_change_percentage_24h: change24h,
        market_cap: currentPrice * (1000000 + Math.random() * 5000000),
        total_volume: currentPrice * (100000 + Math.random() * 500000),
        priceInOurToken: currentPrice / OUR_TOKEN_PRICE_USD,
      }
    })
  }

  return {
    cryptos,
    isLoading,
    error,
    totalPages,
    isUsingDemo: isUsingDemoRef.current,
    ourTokenPrice: OUR_TOKEN_PRICE_USD,
    ourTokenSymbol: OUR_TOKEN_SYMBOL,
    ourTokenName: OUR_TOKEN_NAME,
  }
}

