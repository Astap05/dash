import { useState, useEffect, useRef } from 'react'
import { useCryptoPrices } from './useCryptoPrices'
import { generatePortfolioData, PortfolioData } from '../services/cryptoService'

const TRACKED_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'LINK', 'UNI', 'AAVE']

export function usePortfolioData() {
  const { prices, isConnected } = useCryptoPrices(TRACKED_SYMBOLS)
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (prices.size > 0 || !isConnected) {
      const data = generatePortfolioData(prices)
      setPortfolioData(data)
    }

    // Обновляем данные каждые 2 секунды для плавной анимации
    intervalRef.current = setInterval(() => {
      if (prices.size > 0) {
        const data = generatePortfolioData(prices)
        setPortfolioData(data)
      }
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [prices, isConnected])

  return { portfolioData, isConnected }
}

