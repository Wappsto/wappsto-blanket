import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import { useItemSelector } from '../src';

describe('useItemSelector', () => {
  it('runs correctly', () => {
    const defaultValue = 'key';
    const store = new configureStore();

    const { result } = renderHook(() => useItemSelector(defaultValue), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current).toBe(undefined);
  });

  it('can find an item', () => {
    const defaultValue = 'key';
    const store = new configureStore({ items: { key: 'test' } });

    const { result } = renderHook(() => useItemSelector(defaultValue), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current).toBe('test');
  });
});
