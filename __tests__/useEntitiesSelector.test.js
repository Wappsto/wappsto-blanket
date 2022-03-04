import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import { useEntitiesSelector } from '../src';

describe('useEntitiesSelector', () => {
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

    const { result, rerender } = renderHook(({service, id}) => useEntitiesSelector(service, id), {
      initialProps: { service: service, id: wrong_id },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current).toEqual([]);
    rerender({service: service, id: id});
    expect(result.current[0].name).toEqual('network name');
  });
});
