import { createContext, useContext } from "react"

interface ErrorContextType {
  error: string | null
  showError: (message: string, duration?: number) => void
  clearError: () => void
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export const useError = () => {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}
