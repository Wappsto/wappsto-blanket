import { renderHook, act } from '@testing-library/react-hooks';
import { useRefresh } from '../src';

describe('useRefresh', () => {
  it('runs correctly', async () => {
    const startTime = 100;
    const { waitForNextUpdate, rerender } = renderHook(({ time }) => useRefresh(time), {
      initialProps: { time: startTime },
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    rerender({ time: undefined });
  });
});
