import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useMetrics } from '../src';

describe('useMetrics', () => {
  fetchMock.enableMocks();
  const store = configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('runs correctly', async () => {
    const id = 'test';
    fetch
      .mockResponseOnce(JSON.stringify({ name: 'metrics' }))
      .mockRejectOnce(JSON.stringify({ name: 'metrics' }));

    const { result, unmount } = renderHook(() => useMetrics(id), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData('begin', 'end', 'red');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data.name).toBe('metrics');
    expect(fetchMock).toHaveBeenCalledWith(
      '/services/metrics',
      expect.objectContaining({
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        method: 'POST',
        rawOptions: expect.objectContaining({
          body: {
            operation: 'count_online_iot',
            query: {
              begin: 'begin',
              end: 'end',
              resolution: 'red'
            }
          },
          dispatchEntities: false,
          method: 'POST',
          url: '/metrics'
        }),
        url: '/services/metrics'
      })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData(undefined, 'end', 'red');
      await result.current.getData('start', undefined, 'red');
      await result.current.getData('start', 'end', undefined);
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData(new Date(), new Date(), 'red');
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.cancel();
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('canceled');

    unmount();

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('canceled');
  });
});
