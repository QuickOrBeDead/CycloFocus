import { useEffect } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ErrorProvider } from '../../context/ErrorProvider'
import { ErrorNotification } from '../ErrorNotification'
import { setErrorCallback } from '../../api/axios'
import { useError } from '../../context/ErrorContext'

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200 h-screen"
    >
      <div className="bg-white p-6 w-[90%] sm:w-full sm:max-w-md rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 scale-110 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-2">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="text-base font-bold text-slate-700 uppercase tracking-widest">Something went wrong</p>
        </div>
        <pre className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 w-full text-left whitespace-pre-wrap line-clamp-4 overflow-y-auto max-h-32">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

const ErrorNotificationSetup = ({ children }: { children: ReactNode }) => {
  const { showError } = useError()

  useEffect(() => {
    setErrorCallback((message: string) => {
      showError(message, 5000)
    });
  }, [showError])

  return (
    <>
      {children}
      <ErrorNotification />
    </>
  );
};

interface RootProviderProps {
  children: ReactNode
}

const RootProvider = ({ children }: RootProviderProps) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app here so the error doesn't happen again
      }}
    >
      <ErrorProvider>
        <ErrorNotificationSetup>
          {children}
        </ErrorNotificationSetup>
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default RootProvider
