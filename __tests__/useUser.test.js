import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useUser } from '../src';

describe('useUser', () => {
  fetchMock.enableMocks();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('can get user from Backend', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        meta: { type: 'user', id: 'user_id' },
        name: 'name',
        provider: [{ picture: 'image' }],
      }),
    );
    const store = configureStore();

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.status).toEqual('pending');
    await act(async () => {
      await waitForNextUpdate();
    });
    expect(result.current.status).toEqual('success');

    expect(result.current.name).toEqual('name');
    expect(result.current.icon).toEqual('image');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/services/user?expand=1',
      expect.objectContaining({
        method: 'GET',
        url: '/services/user?expand=1',
      }),
    );
  });

  it('can get user from Redux', async () => {
    const store = configureStore({
      entities: { user: { user_id: { name: 'name' } } },
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current.status).toEqual('success');

    expect(result.current.name).toEqual('name');
    expect(result.current.icon).toBe(undefined);
    expect(fetch).toHaveBeenCalledTimes(0);
  });
});
