import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import { useEntitySelector } from '../src';

describe('useEntitySelector', () => {
  it('runs correctly', () => {
    const store = new configureStore({
      entities: {
        network: {
          network_id: { meta: { type: 'network', id: 'network_id' }, name: 'network name' }
        }
      }
    });

    const service = 'network';
    const id = 'network_id';
    const wrong_id = 'wrong_id';

    const { result, rerender } = renderHook(({ service, id }) => useEntitySelector(service, id), {
      initialProps: { service, id: wrong_id },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current).toBe(undefined);
    rerender({ service, id });
    expect(result.current.name).toEqual('network name');
  });
});
