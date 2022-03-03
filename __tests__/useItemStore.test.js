import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useStoreItem } from '../src';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';

describe('useItemStore', () => {
  it('run correctly', () => {
    const defaultValue = 'key';
    const store = new configureStore({ items: { key: 'test' } });

    const { result } = renderHook(() => useStoreItem(defaultValue), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    const [item, setItem, removeItem] = result.current;

    expect(item).toEqual('test');
    expect(setItem).toEqual(expect.any(Function));
    expect(removeItem).toEqual(expect.any(Function));

    act(() => {
      setItem('new value');
    });

    expect(result.current[0]).toEqual('new value');

    act(() => {
      removeItem();
    });

    expect(result.current[0]).toEqual(undefined);
  });
});
