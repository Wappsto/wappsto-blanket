import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useLogs } from '../src';

describe('useMetrics', () => {
  fetchMock.enableMocks();
  const store = new configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('runs correctly', async () => {
    let stateId = 'e3e44493-8a90-4ea5-bbe4-644855caa6d0';
    let sessionId = 'session';
    let cacheId = 'cache';
    fetch
      .mockResponseOnce(JSON.stringify({ data: [1, 2, 3] }))
      .mockRejectOnce(JSON.stringify({ name: 'metrics' }))
      .mockResponseOnce(JSON.stringify({ data: [1, 2, 3] }));

    const { result, unmount } = renderHook(
      ({ stateId, sessionId, cacheId }) => useLogs(stateId, sessionId, cacheId),
      {
        initialProps: { stateId: stateId, sessionId: sessionId, cacheId: cacheId },
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );

    expect(result.current.status).toEqual('idle');
    expect(result.current.data).toEqual([]);

    await act(async () => {
      await result.current.getLogs();
    });

    expect(result.current.status).toEqual('idle');
    expect(result.current.data).toEqual([]);

    await act(async () => {
      await result.current.getLogs({
        start: 'start',
        end: 'end'
      });
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/services/log/e3e44493-8a90-4ea5-bbe4-644855caa6d0?type=state&limit=3600&start=start&end=end',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-session': 'session'
        },
        method: 'GET',
        rawOptions: expect.objectContaining({
          dispatchEntities: false,
          headers: {
            'x-session': 'session'
          },
          method: 'GET',
          url: '/log/e3e44493-8a90-4ea5-bbe4-644855caa6d0?type=state&limit=3600&start=start&end=end'
        }),
        url: '/services/log/e3e44493-8a90-4ea5-bbe4-644855caa6d0?type=state&limit=3600&start=start&end=end'
      })
    );

    await act(async () => {
      await result.current.getLogs({
        start: 'start',
        end: 'end'
      });
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.data).toEqual([1, 2, 3]);

    await act(async () => {
      await result.current.reset();
    });

    expect(result.current.status).toEqual('idle');
    expect(result.current.data).toEqual([]);

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current.status).toEqual('canceled');
    expect(result.current.data).toEqual([]);

    await act(async () => {
      await result.current.reset();
      await result.current.getLogs({
        start: new Date(),
        end: new Date()
      });
    });

    unmount();
  });
});
