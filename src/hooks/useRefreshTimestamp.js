import { useMemo } from 'react';
import { useRefresh } from './useRefresh';

export function useRefreshTimestamp(timestamp) {
  const date = useMemo(() => new Date(timestamp), [timestamp]);
  const now = Date.now();
  let time;
  if (now - date.getTime() < 60 * 60 * 1000) {
    time = 60 * 1000;
  }
  useRefresh(time);
}
