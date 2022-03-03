import { renderHook, act } from '@testing-library/react-hooks';
import { useVisible } from '../src';

describe('useVisible', () => {
  it('runs correctly', () => {
    const defaultValue = false;

    const { result } = renderHook(() => useVisible(defaultValue));

    const [visible, show, hide] = result.current;

    expect(visible).toEqual(defaultValue);
    expect(show).toEqual(expect.any(Function));
    expect(hide).toEqual(expect.any(Function));

    act(() => {
      show();
    });

    expect(result.current[0]).toEqual(true);

    act(() => {
      hide();
    });

    expect(result.current[0]).toEqual(false);
  });
});
