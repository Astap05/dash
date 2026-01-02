import { useState, useMemo } from 'react'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import { useAllCryptoPrices } from '../hooks/useAllCryptoPrices'
import OurTokenInfo from './OurTokenInfo'

type SortField = 'market_cap' | 'price' | 'change' | 'volume' | 'priceInOurToken'
type SortDirection = 'asc' | 'desc'

function CryptoList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('market_cap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 50

  const { cryptos, isLoading, error, isUsingDemo, totalPages, ourTokenPrice, ourTokenSymbol, ourTokenName } =
    useAllCryptoPrices({
      page: searchQuery.trim() ? 1 : Math.min(currentPage, 3),
      perPage: searchQuery.trim() ? 150 : perPage,
      searchQuery,
    })

  const displayCryptos = useMemo(() => {
    if (!searchQuery.trim()) {
      return cryptos
    }
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return cryptos.slice(startIndex, endIndex)
  }, [cryptos, searchQuery, currentPage, perPage])

  const actualTotalPages = useMemo(() => {
    if (searchQuery.trim()) {
      return Math.ceil(cryptos.length / perPage) || 1
    }
    return totalPages
  }, [searchQuery, cryptos.length, perPage, totalPages])

  const sortedCryptos = useMemo(() => {
    const sorted = [...displayCryptos].sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortField) {
        case 'market_cap':
          aValue = a.market_cap
          bValue = b.market_cap
          break
        case 'price':
          aValue = a.current_price
          bValue = b.current_price
          break
        case 'change':
          aValue = a.price_change_percentage_24h
          bValue = b.price_change_percentage_24h
          break
        case 'volume':
          aValue = a.total_volume
          bValue = b.total_volume
          break
        case 'priceInOurToken':
          aValue = a.priceInOurToken
          bValue = b.priceInOurToken
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return sorted
  }, [displayCryptos, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(6)}`
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-orange-400 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      <OurTokenInfo price={ourTokenPrice} symbol={ourTokenSymbol} name={ourTokenName} />

      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию или символу..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isUsingDemo ? (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">Demo Data</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Live Data</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
            {error}
          </div>
        )}

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left text-sm text-gray-400">
                <th className="pb-3 px-4">#</th>
                <th className="pb-3 px-4">Монета</th>
                <th className="pb-3 px-4"><SortButton field="price">Цена (USD)</SortButton></th>
                <th className="pb-3 px-4"><SortButton field="priceInOurToken">Цена ({ourTokenSymbol})</SortButton></th>
                <th className="pb-3 px-4"><SortButton field="change">24ч</SortButton></th>
                <th className="pb-3 px-4"><SortButton field="volume">Объем 24ч</SortButton></th>
                <th className="pb-3 px-4"><SortButton field="market_cap">Market Cap</SortButton></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Загрузка данных...</td></tr>
              ) : sortedCryptos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Монеты не найдены</td></tr>
              ) : (
                sortedCryptos.map((crypto, index) => (
                  <tr key={crypto.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50 transition-colors">
                    <td className="py-4 px-4 text-gray-400">{(currentPage - 1) * perPage + index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div>
                          <div className="font-semibold">{crypto.name}</div>
                          <div className="text-sm text-gray-400">{crypto.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold">{formatPrice(crypto.current_price)}</td>
                    <td className="py-4 px-4 font-semibold text-orange-400">{crypto.priceInOurToken.toFixed(2)} {ourTokenSymbol}</td>
                    <td className={`py-4 px-4 ${crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-gray-400">{formatNumber(crypto.total_volume)}</td>
                    <td className="py-4 px-4 text-gray-400">{formatNumber(crypto.market_cap)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Загрузка данных...</div>
          ) : sortedCryptos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Монеты не найдены</div>
          ) : (
            sortedCryptos.map((crypto) => (
              <div key={crypto.id} className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div>
                      <div className="font-semibold">{crypto.name}</div>
                      <div className="text-sm text-gray-400">{crypto.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(crypto.current_price)}</div>
                    <div className={`text-sm ${crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Цена ({ourTokenSymbol})</div>
                    <div className="font-semibold text-orange-400">{crypto.priceInOurToken.toFixed(2)} {ourTokenSymbol}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Market Cap</div>
                    <div className="font-semibold">{formatNumber(crypto.market_cap)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && sortedCryptos.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
            >
              Назад
            </button>
            <span className="text-sm text-gray-400">Страница {currentPage} из {actualTotalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= actualTotalPages}
              className="px-4 py-2 bg-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
            >
              Вперед
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CryptoList