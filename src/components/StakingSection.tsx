import WalletButton from './WalletButton'

function StakingSection() {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl p-8">
      <h2 className="text-3xl font-bold mb-4">Find Verified Staking Rewards</h2>
      <p className="text-lg mb-6 text-white/90">
        Enhance your confidence and save time on due diligence by choosing verified
        providers for staking.
      </p>
      <WalletButton variant="section" />
    </div>
  )
}

export default StakingSection

