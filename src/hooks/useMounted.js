import { useEffect, useRef } from 'react';

export default function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
