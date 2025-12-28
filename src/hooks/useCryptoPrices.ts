import { useState, useEffect } from 'react'
import { CryptoPrice } from '../services/cryptoService'
import { useCryptoPricesFallback } from './useCryptoPricesFallback'

// Используем REST API как основной источник (более надежно)
// WebSocket может быть заблокирован или требовать специальной настройки
export function useCryptoPrices(symbols: string[]) {
  // Используем fallback API который работает через REST
  const { prices, isConnected, isUsingDemo } = useCryptoPricesFallback(symbols)

  return { prices, isConnected, isUsingDemo }
}

