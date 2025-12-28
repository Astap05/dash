import Dashboard from './components/Dashboard'
import { WalletProvider } from './contexts/WalletContext'
import AuthGuard from './components/AuthGuard'

function App() {
  return (
    <WalletProvider>
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    </WalletProvider>
  )
}

export default App

