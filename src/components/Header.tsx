import WalletButton from './WalletButton'
import { logout, getCurrentUser } from '../services/authService'
import { LogOut } from 'lucide-react'

function Header() {
  const user = getCurrentUser()

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {/* Переключатель режимов убран */}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1 text-gray-400 hover:text-white transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <WalletButton variant="header" />
      </div>
    </header>
  )
}

export default Header

