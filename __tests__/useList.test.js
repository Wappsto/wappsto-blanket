import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useList } from '../src';

describe('useList', () => {
  fetchMock.enableMocks();
  const store = configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('will return no items when items is undefined', async () => {
    const { result } = renderHook(() => useList({}), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(result.current.items.length).toBe(0);
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can not get items when error', async () => {
    fetch.mockRejectOnce('error');
    const url = '/networkError';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
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
    fetch.mockResponseOnce(
      JSON.stringify([
        {
          meta: {
            type: 'network',
            id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
          },
          name: 'network',
        },
      ]),
    );

    const url = '/networkUrl';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toBe('network');
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can get more items from refresh', async () => {
    fetch
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network',
          },
        ]),
      )
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network',
          },
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068df2',
            },
            name: 'network',
          },
        ]),
      );

    const url = '/networkRefresh';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].meta.id).toEqual('b08f9add-7bb2-463d-8b30-bf38da068dfb');

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.items.length).toBe(2);
    expect(result.current.items[0].meta.id).toEqual('b08f9add-7bb2-463d-8b30-bf38da068dfb');
    expect(result.current.items[1].meta.id).toEqual('b08f9add-7bb2-463d-8b30-bf38da068df2');
  });

  it('can remove items', async () => {
    fetch.mockResponseOnce(
      JSON.stringify([
        {
          meta: {
            type: 'network',
            id: '0ed7f455-cd3a-4550-8bdd-6b0619a68253',
          },
          name: 'network',
        },
      ]),
    );

    const url = '/networkRemove';
    let returnResult;

    const { result, waitForNextUpdate, rerender } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);

    await act(async () => {
      returnResult = await result.current.removeItem('0ed7f455-cd3a-4550-8bdd-6b0619a68253');
    });

    expect(returnResult).toBe(true);

    await act(async () => {
      await rerender();
    });

    await act(async () => {
      returnResult = await result.current.removeItem('0ed7f455-cd3a-4550-8bdd-6b0619a68253');
    });

    expect(returnResult).toBe(false);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(0);
  });

  it('can add items', async () => {
    fetch.mockResponseOnce(
      JSON.stringify([
        {
          meta: {
            type: 'network',
            id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
          },
          name: 'network 1',
        },
        {
          meta: {
            type: 'network',
            id: 'c08f9add-7bb2-463d-8b30-bf38da068dfb',
          },
          name: 'network 2',
        },
      ]),
    );

    const url = '/networkAdd';
    let returnResult;

    const { result, waitForNextUpdate, rerender } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(2);

    await act(async () => {
      returnResult = await result.current.removeItem('b08f9add-7bb2-463d-8b30-bf38da068dfb');
      returnResult = await result.current.removeItem('c08f9add-7bb2-463d-8b30-bf38da068dfb');
    });

    expect(result.current.items.length).toBe(0);

    await act(async () => {
      returnResult = await result.current.addItem('c08f9add-7bb2-463d-8b30-bf38da068dfb');
    });

    expect(returnResult).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);

    await act(async () => {
      returnResult = await result.current.addItem('c08f9add-7bb2-463d-8b30-bf38da068dfb');
    });

    expect(returnResult).toBe(false);

    await act(async () => {
      returnResult = await result.current.addItem('b08f9add-7bb2-463d-8b30-bf38da068dfb', 'end');
    });

    await act(async () => {
      await rerender();
    });

    expect(returnResult).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(2);
    expect(result.current.items[0].meta.id).toEqual('c08f9add-7bb2-463d-8b30-bf38da068dfb');
    expect(result.current.items[1].meta.id).toEqual('b08f9add-7bb2-463d-8b30-bf38da068dfb');
  });

  it('can get items from type', async () => {
    fetch.mockResponseOnce(
      JSON.stringify([
        {
          meta: {
            type: 'network',
            id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
          },
          name: 'network',
        },
      ]),
    );

    const type = 'network';

    const { result, waitForNextUpdate } = renderHook(
      () => useList({ type, id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb' }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
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
          '6e2c362e-22b8-4ae8-8405-e983f09c0842': 'Cosche GPS Air System',
        },
        path: 'name',
        more: false,
      }),
    );

    const url = '/network/b08f9add-7bb2-463d-8b30-bf38da068dfb/device/name';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(4);
    expect(result.current.items[0].name).toBe('Trientwood Portable Kit');
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can load more then the limit', async () => {
    fetch
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'a08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network 1',
          },
          {
            meta: {
              type: 'network',
              id: 'b08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network 2',
          },
        ]),
      )
      .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'c08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network 3',
          },
        ]),
      );

    const url = '/networkMore';

    const { result, waitForNextUpdate } = renderHook(() => useList({ url, query: { limit: 2 } }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(2);
    expect(result.current.items[0].name).toBe('network 1');
    expect(result.current.canLoadMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.items.length).toBe(3);
    expect(result.current.items[0].name).toBe('network 1');
    expect(result.current.items[2].name).toBe('network 3');
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can load values from a device', async () => {
    const valueResponse = [
      {
        state: [
          {
            timestamp: '2022-05-18T07:31:57.575000Z',
            data: '',
            status_payment: 'owned',
            type: 'Report',
            meta: {
              type: 'state',
              version: '2.0',
              manufacturer: '7ff2124c-2af9-4498-92b6-21d00f97cc90',
              owner: 'f770df28-d063-493a-9e51-9eb1c75bfb9c',
              id: '12d98bc2-b278-445a-8d9e-63cd3b71a1b9',
              iot: false,
              application: '916d2a44-0981-4786-8001-d1eda497e12b',
              created: '2022-05-18T07:31:57.634550Z',
              updated: '2022-05-18T07:31:57.634550Z',
              revision: 1,
              changed: '2022-05-18T07:31:57.634550Z',
              size: 1441,
              path: '/network/6e1d786f-4029-42ae-8ece-95bb31b0bcd0/device/b3a829a4-6ec2-43ec-8aac-e4640cb58f6c/value/60bfe4d1-9976-4373-8e38-87d4af8576ba/state/12d98bc2-b278-445a-8d9e-63cd3b71a1b9',
              parent: '60bfe4d1-9976-4373-8e38-87d4af8576ba',
              name_by_user: 'Report',
              tag_by_user: [],
              historical: true,
              tag: [],
              can_update_data: false,
            },
          },
          {
            timestamp: '2022-05-18T07:31:57.694000Z',
            data: '',
            status_payment: 'owned',
            type: 'Control',
            meta: {
              type: 'state',
              version: '2.0',
              manufacturer: '7ff2124c-2af9-4498-92b6-21d00f97cc90',
              owner: 'f770df28-d063-493a-9e51-9eb1c75bfb9c',
              id: '8e0e3600-eef1-4443-bd61-050e54f7b12d',
              iot: false,
              application: '916d2a44-0981-4786-8001-d1eda497e12b',
              created: '2022-05-18T07:31:57.751548Z',
              updated: '2022-05-18T07:31:57.751548Z',
              revision: 1,
              changed: '2022-05-18T07:31:57.751548Z',
              size: 1442,
              path: '/network/6e1d786f-4029-42ae-8ece-95bb31b0bcd0/device/b3a829a4-6ec2-43ec-8aac-e4640cb58f6c/value/60bfe4d1-9976-4373-8e38-87d4af8576ba/state/8e0e3600-eef1-4443-bd61-050e54f7b12d',
              parent: '60bfe4d1-9976-4373-8e38-87d4af8576ba',
              name_by_user: 'Control',
              tag_by_user: [],
              historical: true,
              tag: [],
              can_update_data: false,
            },
          },
        ],
        eventlog: [],
        name: 'Find Device Value Name',
        type: 'temperature',
        period: '2',
        delta: '0',
        permission: 'rw',
        number: { min: 0.0, max: 100.0, step: 1.0, unit: 'unit' },
        meta: {
          type: 'value',
          version: '2.0',
          manufacturer: '7ff2124c-2af9-4498-92b6-21d00f97cc90',
          owner: 'f770df28-d063-493a-9e51-9eb1c75bfb9c',
          id: '60bfe4d1-9976-4373-8e38-87d4af8576ba',
          iot: false,
          application: '916d2a44-0981-4786-8001-d1eda497e12b',
          created: '2022-05-18T07:31:57.516300Z',
          updated: '2022-05-18T07:31:57.751548Z',
          revision: 3,
          changed: '2022-05-18T07:31:57.751548Z',
          size: 1515,
          path: '/network/6e1d786f-4029-42ae-8ece-95bb31b0bcd0/device/b3a829a4-6ec2-43ec-8aac-e4640cb58f6c/value/60bfe4d1-9976-4373-8e38-87d4af8576ba',
          parent: 'b3a829a4-6ec2-43ec-8aac-e4640cb58f6c',
          name_by_user: 'Find Device Value Name',
          tag_by_user: [],
          tag: [],
        },
      },
    ];

    fetch.mockResponseOnce(JSON.stringify(valueResponse));

    const { result, waitForNextUpdate } = renderHook(
      () =>
        useList({
          url: '/device/b3a829a4-6ec2-43ec-8aac-e4640cb58f6c/value',
          reset: false,
          query: { limit: 33, expand: 1, verbose: true },
          resetOnEmpty: true,
        }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toEqual('Find Device Value Name');
    expect(result.current.canLoadMore).toBe(false);
  });

  it('can load without cache', async () => {
    fetch
     .mockResponseOnce(
        JSON.stringify([
          {
            meta: {
              type: 'network',
              id: 'c08f9add-7bb2-463d-8b30-bf38da068dfb',
            },
            name: 'network 3',
          },
        ]),
      );

    const { result, waitForNextUpdate } = renderHook(
      () =>
        useList({
          url: '/networkCache',
          useCache: false,
        }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.canLoadMore).toBe(false);
  });
});
