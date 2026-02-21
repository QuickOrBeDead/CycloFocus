import { useState } from 'react';

export const useLoading = (initialMessage: string = 'Loading...') => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(initialMessage);

  const showLoading = (message?: string) => {
    if (message) {
      setLoadingMessage(message);
    }
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const updateMessage = (message: string) => {
    setLoadingMessage(message);
  };

  const withLoadingMessage = async <T,>(message: string, action: () => Promise<T>): Promise<T> => {
    try {
      setLoadingMessage(message);
      setIsLoading(true);
      return await action();
    } finally {
      setIsLoading(false);
    }
  };

  const withLoading = async <T,>(action: () => Promise<T>): Promise<T> => {
    return withLoadingMessage('Loading...', action);
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    updateMessage,
    withLoading,
    withLoadingMessage,
  };
};
