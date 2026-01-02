import { useOperatorsData } from '../hooks/useOperatorsData'

function StakingOperatorsTable() {
  const { operators } = useOperatorsData()

  const formatTVL = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatStakers = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="text-lg font-semibold">Staking Operators</h3>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live Data
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#2a2a2a]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">#</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">OPERATOR</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">TOTAL TVL</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">APY</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">AVS</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">STAKERS</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((operator) => (
              <tr key={operator.id} className="border-t border-[#2a2a2a] hover:bg-[#2a2a2a]/50 transition-colors">
                <td className="px-6 py-4 text-gray-400">{operator.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${operator.iconBg} flex items-center justify-center text-white font-semibold`}>
                      {operator.icon}
                    </div>
                    <span className="font-medium">{operator.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium transition-all duration-300">{formatTVL(operator.tvl)}</td>
                <td className="px-6 py-4 text-green-400 font-medium transition-all duration-300">{operator.apy.toFixed(2)}%</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    {operator.avs > 4 && (
                      <span className="text-xs text-gray-400 ml-1 font-medium transition-all duration-300">+{operator.avs - 4}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300 transition-all duration-300">{formatStakers(operator.stakers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StakingOperatorsTable