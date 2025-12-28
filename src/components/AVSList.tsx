import { useState, useEffect } from 'react'

interface AVSItem {
  id: number
  name: string
  totalCount: number
}

const baseAVSList: AVSItem[] = [
  { id: 1, name: 'EigenLayer', totalCount: 4 },
  { id: 2, name: 'Hyperlane', totalCount: 17 },
  { id: 3, name: 'AltLayer', totalCount: 4 },
  { id: 4, name: 'Omni Network', totalCount: 29 },
  { id: 5, name: 'Brevis Network', totalCount: 12 },
  { id: 6, name: 'Lagrange', totalCount: 8 },
  { id: 7, name: 'Espresso Systems', totalCount: 4 },
  { id: 8, name: 'Near DA', totalCount: 25 },
]

function AVSList() {
  const [avsList, setAvsList] = useState<AVSItem[]>(baseAVSList)

  useEffect(() => {
    // Обновляем данные каждые 4 секунды для симуляции реальных изменений
    const interval = setInterval(() => {
      setAvsList((prev) =>
        prev.map((item) => ({
          ...item,
          totalCount: Math.max(4, item.totalCount + Math.floor((Math.random() - 0.5) * 2)),
        }))
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-300">AVS</h3>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>
      <div className="space-y-3">
        {avsList.map((avs) => (
          <div
            key={avs.id}
            className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0 transition-all duration-300"
          >
            <div className="flex items-center gap-1.5">
              {/* Всегда показываем 4 цветные точки */}
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            {avs.totalCount > 4 && (
              <span className="text-sm text-gray-400 font-medium transition-all duration-300">
                +{avs.totalCount - 4}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AVSList

