interface AlertModalProps {
  message: string
  onClose: () => void
}

function AlertModal({ message, onClose }: AlertModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] max-w-md w-full mx-4">
        <div className="text-center">
          <p className="text-white mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertModal