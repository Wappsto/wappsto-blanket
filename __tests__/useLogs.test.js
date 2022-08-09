import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useLogs } from '../src';

describe('useLogs', () => {
  fetchMock.enableMocks();
  const store = configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('fails when stateId is missing', async () => {
    const { result } = renderHook(() => useLogs(null, null, null), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    let error;
    result.current.getLogs().catch((err) => {
      error = err.message;
    });

    await new Promise((r) => {
      setTimeout(r, 1);
    });

    expect(error).toBe('stateId is not defined');
  });

  it('runs correctly', async () => {
    const id = 'e3e44493-8a90-4ea5-bbe4-644855caa6d0';
    const session = 'session';
    const cache = 'cache';
    fetch
      .mockResponseOnce(JSON.stringify({ data: [1, 2, 3] }))
      .mockRejectOnce(JSON.stringify({ name: 'metrics' }))
      .mockResponseOnce(JSON.stringify({ data: [1, 2, 3] }));

    const { result, unmount } = renderHook(
      ({ stateId, sessionId, cacheId }) => useLogs(stateId, sessionId, cacheId),
      {
        initialProps: { stateId: id, sessionId: session, cacheId: cache },
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
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
        end: 'end',
      });
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith(
      `/services/log/${id}?type=state&limit=3600&start=start&end=end`,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-session': 'session',
        },
        method: 'GET',
        rawOptions: expect.objectContaining({
          dispatchEntities: false,
          headers: {
            'x-session': 'session',
          },
          method: 'GET',
          url: `/log/${id}?type=state&limit=3600&start=start&end=end`,
        }),
        url: `/services/log/${id}?type=state&limit=3600&start=start&end=end`,
      }),
    );

    await act(async () => {
      await result.current.getLogs({
        start: 'start',
        end: 'end',
      });
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.data).toEqual([1, 2, 3]);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toEqual('idle');
    expect(result.current.data).toEqual([]);

    act(() => {
      result.current.getLogs({
        start: 'start',
        end: 'end',
      });
      result.current.cancel();
    });

    expect(result.current.status).toEqual('canceled');
    expect(result.current.data).toEqual([]);

    await act(async () => {
      result.current.reset();
      await result.current.getLogs({
        start: new Date(),
        end: new Date(),
      });
    });

    expect(result.current.status).toEqual('success');

    unmount();
  });

  it('can load logs like device list', async () => {
    const stateId = '12d98bc2-b278-445a-8d9e-63cd3b71a1b9';
    const sessionId = null;
    const cacheId = 'xng_state_60bfe4d1-9976-4373-8e38-87d4af8576ba_state_report';
    const requestOptions = {
      end: '2022-08-09T08:46:24.347Z',
      limit: 50,
      order: 'descending',
      start: '2009-12-31T23:00:00.000Z',
    };
    const response = {
      meta: { id: '12d98bc2-b278-445a-8d9e-63cd3b71a1b9', type: 'log', version: '2.1' },
      data: [{ time: '2022-05-18T07:31:57.575Z', data: '' }],
      more: false,
      type: 'state',
    };

    fetch.mockResponseOnce(JSON.stringify(response));

    const { result } = renderHook(() => useLogs(stateId, sessionId, cacheId), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.status).toEqual('idle');

    await act(async () => {
      await result.current.getLogs(requestOptions);
    });

    expect(result.current.status).toEqual('success');
    expect(result.current.data.length).toEqual(1);
  });
});
