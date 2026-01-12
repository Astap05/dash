import Dashboard from './components/Dashboard'
import { WalletProvider } from './contexts/WalletContext'
import { LanguageProvider } from './contexts/LanguageContext'
import AuthGuard from './components/AuthGuard'

function App() {
  return (
    <LanguageProvider>
      <WalletProvider>
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </WalletProvider>
    </LanguageProvider>
  )
}

export default App

