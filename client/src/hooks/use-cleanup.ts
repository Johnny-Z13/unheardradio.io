import { useEffect, useRef } from 'react';

/**
 * Hook to register cleanup functions that run on component unmount
 * Prevents memory leaks when switching between screens
 */
export function useCleanup() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = (fn: () => void) => {
    cleanupFunctions.current.push(fn);
  };

  const cleanup = () => {
    cleanupFunctions.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.current = [];
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return { addCleanup, cleanup };
}