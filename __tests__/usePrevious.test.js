import { renderHook, act } from '@testing-library/react-hooks';
import { usePrevious } from '../src';

describe('usePrevious', () => {
  it('runs correctly', async () => {
    const value = 'test';
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value }
    });

    expect(result.current).toEqual(undefined);

    await act(async () => {
      await rerender();
    });

    expect(result.current).toEqual('test');
  });
});
