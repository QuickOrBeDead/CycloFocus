import { Loader2 } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useLoading } from "../hooks/useLoading";

export interface LoadingOverlayHandle {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  updateMessage: (message: string) => void;
  withLoading: <T>(action: () => Promise<T>) => Promise<T>;
  withLoadingMessage: <T>(message: string, action: () => Promise<T>) => Promise<T>;
}

// --- Loading Overlay Component ---
const LoadingOverlay = forwardRef<LoadingOverlayHandle>((_, ref) => {
  const { isLoading, loadingMessage, showLoading, hideLoading, updateMessage, withLoading, withLoadingMessage } = useLoading();

  useImperativeHandle(ref, () => ({
    showLoading,
    hideLoading,
    updateMessage,
    withLoading,
    withLoadingMessage,
  }));

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200 h-screen">
      <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 scale-110 animate-in zoom-in-95 duration-300">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <div className="absolute inset-0 blur-lg bg-blue-400/20 animate-pulse" />
        </div>
        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{loadingMessage}</p>
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;