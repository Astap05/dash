import { useState, useEffect, useRef } from 'react'
import { OperatorData, generateOperatorData } from '../services/cryptoService'

const baseOperators: OperatorData[] = [
  {
    id: 1,
    name: 'Galaxy',
    icon: '⭐',
    iconBg: 'bg-yellow-500/20',
    tvl: 2170000,
    apy: 3.12,
    avs: 4,
    stakers: 105019,
  },
  {
    id: 2,
    name: 'Kiin',
    icon: 'B',
    iconBg: 'bg-blue-500/20',
    tvl: 2450000,
    apy: 2.85,
    avs: 17,
    stakers: 98423,
  },
  {
    id: 3,
    name: 'K3-Labs',
    icon: 'K3',
    iconBg: 'bg-purple-500/20',
    tvl: 7890000,
    apy: 1.47,
    avs: 4,
    stakers: 15782,
  },
  {
    id: 4,
    name: 'Unknown',
    icon: '◆',
    iconBg: 'bg-red-500/20',
    tvl: 5120000,
    apy: 0.32,
    avs: 29,
    stakers: 27105,
  },
  {
    id: 5,
    name: 'Whizzy6866',
    icon: '🌀',
    iconBg: 'bg-cyan-500/20',
    tvl: 9340000,
    apy: 2.12,
    avs: 12,
    stakers: 45219,
  },
  {
    id: 6,
    name: 'New Hill',
    icon: 'OP',
    iconBg: 'bg-orange-500/20',
    tvl: 3670000,
    apy: 0.76,
    avs: 8,
    stakers: 76832,
  },
  {
    id: 7,
    name: 'Nomad Noer',
    icon: 'N',
    iconBg: 'bg-blue-500/20',
    tvl: 4250000,
    apy: 1.98,
    avs: 25,
    stakers: 103967,
  },
  {
    id: 8,
    name: 'Celo Euro',
    icon: '▲',
    iconBg: 'bg-red-500/20',
    tvl: 6780000,
    apy: 2.45,
    avs: 19,
    stakers: 54321,
  },
]

export function useOperatorsData() {
  const [operators, setOperators] = useState<OperatorData[]>(baseOperators)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Обновляем данные каждые 3 секунды для симуляции реальных изменений
    const updateData = () => {
      const updated = generateOperatorData(baseOperators)
      setOperators(updated)
    }

    updateData() // Первоначальная загрузка
    intervalRef.current = setInterval(updateData, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return { operators }
}
