import { useState, useEffect } from 'react'
import { isAuthenticated } from '../services/authService'
import AuthModal from './AuthModal'

interface AuthGuardProps {
  children: React.ReactNode
}

function AuthGuard({ children }: AuthGuardProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    const checkAuth = () => {
      const auth = isAuthenticated()
      setAuthenticated(auth)
      setShowAuthModal(!auth)
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthSuccess = () => {
    setAuthenticated(true)
    setShowAuthModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    )
  }

  return (
    <>
      {authenticated ? children : null}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {}}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}

export default AuthGuard