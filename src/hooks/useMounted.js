import { useEffect, useRef } from 'react';

export default function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => () => {
      isMountedRef.current = false;
    }, []);

  return isMountedRef;
}
