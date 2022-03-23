import { useEffect, useRef } from 'react';

export function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => () => {
      isMountedRef.current = false;
    }, []);

  return isMountedRef;
}
