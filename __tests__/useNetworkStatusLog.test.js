import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useNetworkStatusLog } from '../src';

describe('useNetworkStatusLog', () => {
  fetchMock.enableMocks();
  const store = configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('runs correctly when there is errors', async () => {
    const testValue = 'test';
    const { result, rerender, unmount } = renderHook(({ value }) => useNetworkStatusLog(value), {
      initialProps: { value: testValue },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe(undefined);

    await act(async () => {
      await result.current.get();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([]);
    expect(result.current.status).toEqual('error');

    fetch.mockRejectOnce(JSON.stringify({}));

    await act(async () => {
      await rerender();
      await result.current.get();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([]);
    expect(result.current.status).toEqual('error');

    await act(async () => {
      result.current.get();
      unmount();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.data).toEqual([]);
    expect(result.current.status).toEqual('error');
  });

  it('runs correctly', async () => {
    fetch
      .mockResponseOnce(JSON.stringify({ data: [{ id: 1 }, { id: 2 }], more: true }))
      .mockResponseOnce(JSON.stringify({ data: [{ id: 2 }, { id: 3 }], more: false }));

    const testValue = 'test';
    const { result } = renderHook(({ value }) => useNetworkStatusLog(value), {
      initialProps: { value: testValue },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    let start = new Date();
    let end = new Date();
    const limit = 3;
    let resetCache = true;
    await act(async () => {
      await result.current.get({
        start,
        end,
        limit,
        resetCache,
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result.current.status).toEqual('success');

    start = '2022-02-02T02:02:02Z';
    end = '2023-02-02T02:02:02Z';
    resetCache = false;
    await act(async () => {
      await result.current.get({
        start,
        end,
        limit,
        resetCache,
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result.current.status).toEqual('success');
  });
});
