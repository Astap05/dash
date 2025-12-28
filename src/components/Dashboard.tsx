import Header from './Header'
import StatsCards from './StatsCards'
import StakingSection from './StakingSection'
import CryptoIcons from './CryptoIcons'
import StakingOperatorsTable from './StakingOperatorsTable'

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6">
        <Header />
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
      </div>
    </div>
  )
}

export default Dashboard

