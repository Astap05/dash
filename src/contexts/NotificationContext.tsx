import { createContext, useContext, ReactNode, useState } from 'react'

interface NotificationContextType {
  showAlert: (message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const showAlert = (message: string) => {
    setAlertMessage(message)
  }

  return (
    <NotificationContext.Provider value={{ showAlert }}>
      {children}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] max-w-md w-full mx-4">
            <div className="text-center">
              <p className="text-white mb-6">{alertMessage}</p>
              <button
                onClick={() => setAlertMessage(null)}
                className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}