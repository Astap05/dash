import { TrendingUp, DollarSign, Activity } from 'lucide-react'

interface OurTokenInfoProps {
  price: number
  symbol: string
  name: string
}

function OurTokenInfo({ price, symbol, name }: OurTokenInfoProps) {
  // Заглушки для статистики нашего токена
  const marketCap = 10000000 // $10M (заглушка)
  const totalSupply = 100000000 // 100M токенов (заглушка)
  const change24h = 2.5 // +2.5% (заглушка)
  const volume24h = 500000 // $500K (заглушка)

  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg">
            {symbol.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${price.toFixed(4)}</div>
          <div className={`text-sm flex items-center gap-1 ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className="w-4 h-4" />
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
          <div className="text-sm font-semibold">${(marketCap / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total Supply</div>
          <div className="text-sm font-semibold">{(totalSupply / 1000000).toFixed(0)}M</div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">24h Volume</div>
          <div className="text-sm font-semibold">${(volume24h / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div className="text-sm font-semibold text-yellow-400 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Coming Soon
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-400">
          ⚠️ Это демонстрационные данные. Токен находится в разработке.
        </p>
      </div>
    </div>
  )
}

export default OurTokenInfo

