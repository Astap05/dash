import { useState } from 'react'
import { X } from 'lucide-react'
import { register, login } from '../services/authService'
import { useLanguage } from '../contexts/LanguageContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useLanguage()
  const [isLogin, setIsLogin] = useState(true)
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await login(nickname, pin)
      } else {
        await register(nickname, pin)
      }
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNickname('')
    setPin('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {isLogin ? t('login') : t('register')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('nickname')}</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-orange-500"
              placeholder={t('nickname_placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('pin')}</label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              pattern="\d{4}"
              maxLength={4}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-orange-500"
              placeholder={t('pin_placeholder')}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : isLogin ? t('login_button') : t('register_button')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin
              ? t('no_account')
              : t('have_account')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

