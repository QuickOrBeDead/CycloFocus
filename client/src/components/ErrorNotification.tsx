import { AlertCircle, X } from 'lucide-react'
import { useError } from '../context/ErrorContext'

export const ErrorNotification = () => {
  const { error, clearError } = useError()

  if (!error) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top duration-200">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex gap-3 items-start max-w-sm">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">Data Operation Error</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={clearError}
          className="text-red-600 hover:text-red-700 flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
