import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useIds } from '../src';

describe('useIds', () => {
  fetchMock.enableMocks();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('can get ids from Redux', async () => {
    fetch
      .mockResponseOnce(
        JSON.stringify([{ meta: { type: 'network', id: 'network_id_2' }, name: 'network name 2' }])
      )
      .mockResponseOnce(
        JSON.stringify([{ meta: { type: 'network', id: 'network_id_3' }, name: 'network name 3' }])
      );

    const store = configureStore({
      entities: {
        network: {
          network_id: { meta: { type: 'network', id: 'network_id' }, name: 'network name' }
        }
      }
    });

    const network = 'network';
    const networkIds = ['network_id'];
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ service, ids }) => useIds(service, ids),
      {
        initialProps: { service: network, ids: networkIds },
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toEqual('network name');
    expect(result.current.status).toEqual('success');
    expect(fetch).toHaveBeenCalledTimes(0);

    const newIds = ['network_id_2'];
    rerender({ service: network, ids: newIds });

    expect(result.current.status).toEqual('pending');
    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.items[0].name).toEqual('network name 2');
    expect(fetch).toHaveBeenCalledWith(
      '/services/network?id=network_id_2',
      expect.objectContaining({
        method: 'GET',
        url: '/services/network?id=network_id_2'
      })
    );
    expect(fetch).toHaveBeenCalledTimes(1);

    const newIds2 = ['network_id_2', 'network_id_3'];
    rerender({ service: network, ids: newIds2 });

    expect(result.current.status).toEqual('pending');
    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.items[0].name).toEqual('network name 2');
    expect(result.current.items[1].name).toEqual('network name 3');
    expect(fetch).toHaveBeenCalledWith(
      '/services/network?id=network_id_3',
      expect.objectContaining({
        method: 'GET',
        url: '/services/network?id=network_id_3'
      })
    );
    expect(fetch).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.setStatus('changed');
    });

    expect(result.current.status).toEqual('changed');

    act(() => {
      result.current.refresh();
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith(
      '/services/network?id=network_id_2&id=network_id_3',
      expect.objectContaining({
        method: 'GET',
        url: '/services/network?id=network_id_2&id=network_id_3'
      })
    );
  });
});
