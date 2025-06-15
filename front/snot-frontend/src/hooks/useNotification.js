import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  return {
    notification,
    showNotification,
  };
}; 