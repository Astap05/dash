import Dashboard from './components/Dashboard'
import { WalletProvider } from './contexts/WalletContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import AuthGuard from './components/AuthGuard'

function App() {
  return (
    <NotificationProvider>
      <LanguageProvider>
        <WalletProvider>
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        </WalletProvider>
      </LanguageProvider>
    </NotificationProvider>
  )
}

export default App

