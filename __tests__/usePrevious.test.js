import { renderHook, act } from '@testing-library/react-hooks';
import { usePrevious } from '../src';

describe('usePrevious', () => {
  it('runs correctly', async () => {
    const testValue = 'test';
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: testValue },
    });

    expect(result.current).toEqual(undefined);

    await act(async () => {
      await rerender();
    });

    expect(result.current).toEqual('test');
  });
});
