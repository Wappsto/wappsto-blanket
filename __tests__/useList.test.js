import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useList } from '../src';

describe('useList', () => {
  fetchMock.enableMocks();
  const store = new configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('will return no items when items is undefined', async () => {
    const { result } = renderHook(() => useList(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(result.current.items.length).toBe(0);
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can not get items when error', async () => {
    fetch.mockRejectOnce('error');
    const url = '/network';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(0);
    expect(result.current.canLoadMore).toBe(false);
    expect(result.current.request.status).toBe('error');
    expect(result.current.request.method).toBe('GET');
  });

  it('can get items from url', async () => {
    fetch
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb'
            },
            name: 'network'
          }
        ])
      )
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb'
            },
            name: 'network'
          },
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068df2'
            },
            name: 'network'
          }
        ])
      );

    const url = '/network?name=test';

    const { result, waitForNextUpdate, rerender } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toBe('network');
    expect(result.current.canLoadMore).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.items.length).toBe(2);

    await act(async () => {
      await result.current.addItem('0ed7f455-cd3a-4550-8bdd-6b0619a68253');
    });

    await act(async () => {
      await rerender();
    });

    await act(async () => {
      await result.current.removeItem('0ed7f455-cd3a-4550-8bdd-6b0619a68253');
    });

    await act(async () => {
      await rerender();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.items.length).toBe(2);
  });

  it('can get items from type', async () => {
    fetch.mockResponseOnce(
      JSON.stringify([
        {
          meta: {
            type: 'network',
            id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb'
          },
          name: 'network'
        }
      ])
    );

    const type = 'network';

    const { result, waitForNextUpdate } = renderHook(
      () => useList({ type, id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb' }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toBe('network');
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can get an attribute list', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        meta: { type: 'attributelist', version: '2.0' },
        data: {
          'bd93c35e-f251-4fbd-9938-f01effd3c65f': 'Trientwood Portable Kit',
          'd5733dc7-9593-40c3-be44-e7c0699f45b6': 'Poune Power Bracket',
          'cf53d1b2-b7ed-40fb-ab4b-3677f0aed2b0': 'Truck Video Bracket',
          '6e2c362e-22b8-4ae8-8405-e983f09c0842': 'Cosche GPS Air System'
        },
        path: 'name',
        more: false
      })
    );

    const url = '/network/b08f9add-7bb2-463d-8b30-bf38da068dfb/device/name';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(4);
    expect(result.current.items[0].name).toBe('Trientwood Portable Kit');
    expect(result.current.canLoadMore).toBe(false);
  });
});
