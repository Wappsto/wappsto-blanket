import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import { useEntitiesSelector } from '../src';

describe('useEntitiesSelector', () => {
  it('runs correctly', () => {
    const store = configureStore({
      entities: {
        network: {
          network_id: { meta: { type: 'network', id: 'network_id' }, name: 'network name' },
        },
      },
    });

    const network = 'network';
    const networkId = 'network_id';
    const wrongId = 'wrong_id';

    const { result, rerender } = renderHook(({ service, id }) => useEntitiesSelector(service, id), {
      initialProps: { service: network, id: wrongId },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toEqual([]);
    rerender({ service: network, id: networkId });
    expect(result.current[0].name).toEqual('network name');
  });
});
