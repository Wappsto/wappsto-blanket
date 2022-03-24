import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import { useEntitySelector } from '../src';

describe('useEntitySelector', () => {
  it('runs correctly', () => {
    const store = configureStore({
      entities: {
        network: {
          network_id: { meta: { type: 'network', id: 'network_id' }, name: 'network name' }
        }
      }
    });

    const network = 'network';
    const networkId = 'network_id';
    const wrongId = 'wrong_id';

    const { result, rerender } = renderHook(({ service, id }) => useEntitySelector(service, id), {
      initialProps: { service: network, id: wrongId },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current).toBe(undefined);
    rerender({ service: network, id: networkId });
    expect(result.current.name).toEqual('network name');
  });
});
