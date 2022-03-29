import { renderHook } from '@testing-library/react-hooks';
import { useRefreshTimestamp } from '../src';

describe('useRefreshTimestamp', () => {
  it('runs correctly', async () => {
    const startTime = Date.now();
    const { rerender } = renderHook(({ time }) => useRefreshTimestamp(time), {
      initialProps: { time: startTime },
    });

    rerender({ time: undefined });
  });
});
