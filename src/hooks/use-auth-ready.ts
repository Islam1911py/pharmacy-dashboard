import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Wait for next tick to ensure localStorage is available
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return isReady && isAuthenticated;
}
