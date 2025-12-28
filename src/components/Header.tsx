import { useState } from 'react'
import WalletButton from './WalletButton'
import { logout, getCurrentUser } from '../services/authService'
import { LogOut } from 'lucide-react'

function Header() {
  const [mode, setMode] = useState<'lite' | 'advanced'>('lite')
  const user = getCurrentUser()

  const navItems = ['DASHBOARD', 'STAKING', 'OPERATORS', 'AVS', 'DEFI']

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
          <button
            onClick={() => setMode('lite')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'lite'
                ? 'bg-[#2a2a2a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            LITE MODE
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'advanced'
                ? 'bg-[#2a2a2a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ADVANCED MODE
          </button>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>
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

