import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useRequest } from '../src';

describe('useRequest', () => {
  fetchMock.enableMocks();
  const store = configureStore();
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('can load from showme', async () => {
    const res = {"file_id":"dc1695e7-346d-4e64-9dcf-29c562362042","status":"ok"};
    fetch.mockResponseOnce(JSON.stringify(res), { status: 201 });

    const { waitForNextUpdate, result } = renderHook(() => useRequest(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

    await act(async () => {
      await result.current.send({ method: "GET", url: "https://showme.wappsto.com"});
    });

    expect(result.current.request.status).toBe('success');
  });
});
