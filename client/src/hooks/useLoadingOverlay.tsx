import { useRef } from 'react';
import LoadingOverlay, { type LoadingOverlayHandle } from '../components/LoadingOverlay';

export const useLoadingOverlay = () => {
  const loadingRef = useRef<LoadingOverlayHandle>(null);

  const showLoading = (message?: string) => {
    loadingRef.current?.showLoading(message);
  };

  const hideLoading = () => {
    loadingRef.current?.hideLoading();
  };

  const updateMessage = (message: string) => {
    loadingRef.current?.updateMessage(message);
  };

  const withLoading = async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    return await loadingRef.current?.withLoading(action);
  };

  const withLoadingMessage = async <T,>(message: string, action: () => Promise<T>): Promise<T | undefined> => {
    return await loadingRef.current?.withLoadingMessage(message, action);
  };

  const LoadingComponent = () => <LoadingOverlay ref={loadingRef} />;

  return {
    showLoading,
    hideLoading,
    updateMessage,
    withLoading,
    withLoadingMessage,
    LoadingComponent,
  };
};
