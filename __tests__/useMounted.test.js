import { renderHook } from '@testing-library/react-hooks';
import { useMounted } from '../src';

describe('useMounted', () => {
  it('runs correctly', () => {
    const { result, unmount } = renderHook(() => useMounted(), { initialProps: {} });

    expect(result.current.current).toBe(true);

    unmount();

    expect(result.current.current).toBe(false);
  });
});
