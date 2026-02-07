import { useState, useCallback, type ReactNode } from 'react'
import { ErrorContext } from './ErrorContext'


export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null)

  const showError = useCallback((message: string, duration = 5000) => {
    setError(message)
    if (duration > 0) {
      setTimeout(() => setError(null), duration)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  )
}


