import { useState, useEffect } from 'react'

interface Transaction {
  id: number
  invoice_id: string
  tx_hash: string
  amount: number
  status: string
  confirmations: number
  created_at: string
  nickname: string
  currency: string
  network: string
  invoice_amount: string
}

interface WalletBalance {
  address: string
  network: string
  currency: string
  balance: string
  error?: string
  lastChecked: string
}

function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transactions' | 'balances'>('transactions')

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/invoices/transactions/admin')
      const data = await response.json()

      if (data.success) {
        setTransactions(data.data)
      } else {
        setError(data.error || 'Failed to load transactions')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalances = async () => {
    try {
      setBalancesLoading(true)
      const response = await fetch('http://localhost:3001/api/wallets/balances')
      const data = await response.json()

      if (data.success) {
        setBalances(data.data)
      } else {
        setError(data.error || 'Failed to load balances')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setBalancesLoading(false)
    }
  }

  const simulatePayment = async (currency: string, network: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/invoices/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
          network,
          amount: 0.01,
          nickname: 'Admin Test'
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Test payment simulated for ${currency} on ${network}`)
        fetchTransactions() // Refresh list
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch (err) {
      alert('Failed to simulate payment')
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'balances'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Wallet Balances
          </button>
        </div>

        {activeTab === 'transactions' && (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Simulate Test Payments</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => simulatePayment('XRP', 'ripple')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Test XRP Payment
                </button>
                <button
                  onClick={() => simulatePayment('ETH', 'ethereum')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Test ETH Payment
                </button>
                <button
                  onClick={() => simulatePayment('BTC', 'bitcoin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Test BTC Payment
                </button>
                <button
                  onClick={() => simulatePayment('SOL', 'solana')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Test SOL Payment
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">All Transactions</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-[#2a2a2a]">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Currency</th>
                      <th className="px-6 py-3">Network</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">TX Hash</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
                        <td className="px-6 py-4">{tx.id}</td>
                        <td className="px-6 py-4">{tx.nickname}</td>
                        <td className="px-6 py-4">{tx.currency}</td>
                        <td className="px-6 py-4">{tx.network}</td>
                        <td className="px-6 py-4">{tx.amount} {tx.currency}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {tx.tx_hash ? `${tx.tx_hash.slice(0, 10)}...` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === 'confirmed' ? 'bg-green-500 text-white' :
                            tx.status === 'pending' ? 'bg-yellow-500 text-black' :
                            'bg-red-500 text-white'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No transactions found
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'balances' && (
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Wallet Balances</h2>
              <button
                onClick={fetchBalances}
                disabled={balancesLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded transition-colors"
              >
                {balancesLoading ? 'Loading...' : 'Refresh Balances'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-[#2a2a2a]">
                  <tr>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3">Network</th>
                    <th className="px-6 py-3">Currency</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => (
                    <tr key={balance.address} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
                      <td className="px-6 py-4 font-mono text-xs">
                        {balance.address.slice(0, 10)}...{balance.address.slice(-8)}
                      </td>
                      <td className="px-6 py-4">{balance.network}</td>
                      <td className="px-6 py-4">{balance.currency}</td>
                      <td className="px-6 py-4 font-semibold">
                        {parseFloat(balance.balance).toFixed(6)} {balance.currency}
                      </td>
                      <td className="px-6 py-4">
                        {balance.error ? (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            Error
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(balance.lastChecked).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {balances.length === 0 && !balancesLoading && (
              <div className="text-center py-8 text-gray-400">
                No balances found. Click "Refresh Balances" to load current balances.
              </div>
            )}

            {balances.some(b => b.error) && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  Some balances could not be loaded due to RPC errors. This is normal and doesn't affect functionality.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard