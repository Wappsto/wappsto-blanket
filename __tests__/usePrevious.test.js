import { renderHook } from '@testing-library/react-hooks';
import { usePrevious } from '../src';

describe('usePrevious', () => {
  it('runs correctly', () => {
    const { result } = renderHook(() => {
      usePrevious({ key: 'test' });
    });
    expect(result.current).toEqual(undefined);
  });
});
