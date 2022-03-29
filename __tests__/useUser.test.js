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
        nickname: 'nickname',
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

    expect(result.current.name).toEqual('nickname');
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
      entities: { user: { user_id: { first_name: 'first', last_name: 'last' } } },
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current.status).toEqual('success');

    expect(result.current.name).toEqual('first last');
    expect(result.current.icon).toBe(undefined);
    expect(fetch).toHaveBeenCalledTimes(0);
  });

  it('can get user from Redux with provider', async () => {
    const store = configureStore({
      entities: {
        user: { user_id: { provider: [{ name: 'provider name', email: 'provider mail' }] } },
      },
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current.status).toEqual('success');

    expect(result.current.name).toEqual('provider name');
    expect(result.current.icon).toBe(undefined);
    expect(fetch).toHaveBeenCalledTimes(0);
  });

  it('can get user from Redux with email', async () => {
    const store = configureStore({
      entities: { user: { user_id: { email: 'email', provider: [{}] } } },
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current.status).toEqual('success');

    expect(result.current.name).toEqual('email');
    expect(result.current.icon).toBe(undefined);
    expect(fetch).toHaveBeenCalledTimes(0);
  });
});
