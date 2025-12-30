import { useState } from 'react'
import Header from './Header'
import StatsCards from './StatsCards'
import StakingSection from './StakingSection'
import CryptoIcons from './CryptoIcons'
import StakingOperatorsTable from './StakingOperatorsTable'
import CryptoList from './CryptoList'
import InvoiceCreator from './InvoiceCreator'

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'crypto-list' | 'invoice'>('dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6">
        <Header />
        
        {/* Табы для переключения между дашбордом, списком монет и созданием инвойсов */}
        <div className="mt-6 flex gap-2 border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('crypto-list')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'crypto-list'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Все монеты
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'invoice'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Create Invoice
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            <div className="mt-8">
              <StatsCards />
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StakingSection />
              <CryptoIcons />
            </div>
            <div className="mt-8">
              <StakingOperatorsTable />
            </div>
          </>
        ) : activeTab === 'crypto-list' ? (
          <div className="mt-8">
            <CryptoList />
          </div>
        ) : (
          <div className="mt-8">
            <InvoiceCreator />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

