// Сервис для работы с криптовалютными данными через WebSocket

export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  volume24h: number
}

export interface PortfolioData {
  totalValue: number
  change24h: number
  apy: number
  totalRewards: number
  chartData: number[]
}

export interface OperatorData {
  id: number
  name: string
  icon: string
  iconBg: string
  tvl: number
  apy: number
  avs: number // Actively Validated Services - количество сервисов, которые валидирует оператор
  stakers: number
}

// Маппинг символов для Binance
const SYMBOL_MAP: Record<string, string> = {
  BTC: 'btcusdt',
  ETH: 'ethusdt',
  BNB: 'bnbusdt',
  SOL: 'solusdt',
  XRP: 'xrpusdt',
  ADA: 'adausdt',
  DOGE: 'dogeusdt',
  TRX: 'trxusdt',
  MATIC: 'maticusdt',
  DOT: 'dotusdt',
  LINK: 'linkusdt',
  UNI: 'uniusdt',
  AAVE: 'aaveusdt',
  ATOM: 'atomusdt',
  ETC: 'etcusdt',
  LTC: 'ltcusdt',
  BCH: 'bchusdt',
  XLM: 'xlmusdt',
  ALGO: 'algousdt',
  FIL: 'filusdt',
  AVAX: 'avaxusdt',
  NEAR: 'nearusdt',
  APT: 'aptusdt',
  ARB: 'arbusdt',
  OP: 'opusdt',
}

// Получить символ для Binance
export function getBinanceSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toLowerCase()}usdt`
}

// Подключение к Binance WebSocket для получения цен
export function createBinanceWebSocketUrl(symbols: string[]): string {
  if (symbols.length === 0) {
    // Fallback на популярные монеты если список пуст
    symbols = ['BTC', 'ETH', 'BNB']
  }
  
  const streams = symbols
    .map((sym) => {
      const binanceSym = getBinanceSymbol(sym).toLowerCase()
      return `${binanceSym}@ticker`
    })
    .join('/')
  
  return `wss://stream.binance.com:9443/stream?streams=${streams}`
}

// Парсинг данных от Binance
export function parseBinanceTicker(data: any): CryptoPrice | null {
  try {
    // Binance отправляет данные в формате { stream: "...", data: {...} }
    if (!data?.data) return null

    const ticker = data.data
    if (!ticker?.s || !ticker?.c) return null

    const symbol = ticker.s.replace('USDT', '').toUpperCase()
    const price = parseFloat(ticker.c)
    const change24h = parseFloat(ticker.P || '0')
    const volume24h = parseFloat(ticker.v || '0')

    if (isNaN(price) || price <= 0) return null

    return {
      symbol,
      price,
      change24h,
      volume24h,
    }
  } catch (error) {
    console.error('Error parsing Binance ticker:', error)
    return null
  }
}

// Генерация данных портфеля на основе реальных цен
export function generatePortfolioData(
  prices: Map<string, CryptoPrice>,
  baseValue: number = 124237
): PortfolioData {
  // Симулируем портфель на основе реальных цен
  const totalValue = baseValue + (Math.random() - 0.5) * 5000
  const change24h = prices.size > 0
    ? Array.from(prices.values()).reduce((sum, p) => sum + p.change24h, 0) / prices.size
    : 27.03
  const apy = 8.7 + (Math.random() - 0.5) * 0.5
  const totalRewards = totalValue * (apy / 100) * 0.1

  // Генерация данных графика (последние 20 точек)
  const chartData: number[] = []
  let lastValue = totalValue
  for (let i = 0; i < 20; i++) {
    lastValue = lastValue * (1 + (Math.random() - 0.5) * 0.02)
    chartData.push(Math.max(0, lastValue))
  }

  return {
    totalValue,
    change24h,
    apy,
    totalRewards,
    chartData,
  }
}

// Генерация данных операторов с вариациями
export function generateOperatorData(baseOperators: OperatorData[]): OperatorData[] {
  return baseOperators.map((op) => ({
    ...op,
    tvl: op.tvl * (0.95 + Math.random() * 0.1),
    apy: Math.max(0, op.apy + (Math.random() - 0.5) * 0.2),
    avs: Math.max(4, op.avs + Math.floor((Math.random() - 0.5) * 2)), // AVS может изменяться
    stakers: Math.floor(op.stakers * (0.98 + Math.random() * 0.04)),
  }))
}

