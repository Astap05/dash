import { useCryptoPricesFallback } from './useCryptoPricesFallback'

// Используем REST API как основной источник (более надежно)
export function useCryptoPrices(symbols: string[]) {
  // Используем fallback API который работает через REST
  const { prices, isConnected, isUsingDemo } = useCryptoPricesFallback(symbols)

  return { prices, isConnected, isUsingDemo }
}