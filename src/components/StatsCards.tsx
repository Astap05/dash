import { TrendingUp, TrendingDown } from 'lucide-react'
import { usePortfolioData } from '../hooks/usePortfolioData'

interface StatCardProps {
  title: string
  value: string
  change: string
  changePositive: boolean
  graphColor: string
  chartData?: number[]
}

function StatCard({ title, value, change, changePositive, graphColor, chartData }: StatCardProps) {
  // Нормализация данных графика для отображения
  const normalizedData = chartData && chartData.length > 0
    ? chartData.map((val) => {
        const min = Math.min(...chartData)
        const max = Math.max(...chartData)
        const range = max - min || 1
        return ((val - min) / range) * 60 + 20 // Масштабируем от 20% до 80%
      })
    : Array.from({ length: 20 }).map(() => Math.random() * 60 + 20)

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            changePositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {changePositive ? '+' : ''}{change}
        </span>
        {changePositive ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="mt-4 h-12 flex items-end gap-1">
        {normalizedData.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${graphColor} transition-all duration-300`}
            style={{
              height: `${height}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function StatsCards() {
  const { portfolioData, isConnected } = usePortfolioData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Данные по умолчанию, если еще нет подключения
  const totalPortfolio = portfolioData?.totalValue ?? 124237
  const portfolioChange = portfolioData?.change24h ?? 27.03
  const apy = portfolioData?.apy ?? 8.7
  const apyChange = 1.17
  const totalRewards = portfolioData?.totalRewards ?? 7307
  const rewardsChange = 14.59
  const chartData = portfolioData?.chartData

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="relative">
        {!isConnected && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Подключение..." />
        )}
        <StatCard
          title="Total Portfolio"
          value={formatCurrency(totalPortfolio)}
          change={formatPercent(portfolioChange)}
          changePositive={portfolioChange >= 0}
          graphColor="bg-white"
          chartData={chartData}
        />
      </div>
      <div className="relative">
        {!isConnected && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Подключение..." />
        )}
        <StatCard
          title="APY"
          value={formatPercent(apy)}
          change={formatPercent(apyChange)}
          changePositive={true}
          graphColor="bg-green-400"
          chartData={chartData}
        />
      </div>
      <div className="relative">
        {!isConnected && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Подключение..." />
        )}
        <StatCard
          title="Total Rewards"
          value={formatCurrency(totalRewards)}
          change={formatPercent(rewardsChange)}
          changePositive={true}
          graphColor="bg-yellow-400"
          chartData={chartData}
        />
      </div>
    </div>
  )
}

export default StatsCards

