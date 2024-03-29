import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore, addEntities } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useStorePagination } from '../src';

Error.stackTraceLimit = 30;

describe('useStorePageination', () => {
  fetchMock.enableMocks();
  const store = configureStore();
  const idResponse = JSON.stringify({
    child: [{ type: 'network', version: '2.0' }],
    id: [
      '5f4f6649-41a6-478c-94ba-41f56ec74591',
      'dec1de41-caa6-4095-b59f-84a852023c7b',
      '13c24904-ba1d-4944-8d5e-6e30c2377607',
      'b5a94a6d-a377-4616-9382-23cde976ec3d',
      'ff42c059-0028-43ba-a9f3-4c6b84c362c7',
      'b62439fd-0266-44f0-88e1-5de96d970aa0',
      '981088a8-6abf-46de-b675-14aba6d2907b',
      '6b8bd990-f3df-4e4d-bce2-bd65ab68a378',
      '335b87c2-e21c-43f5-b763-51b51b55f23b',
      '26b19be3-d7a4-4961-8544-b57700d55eaa',
      '11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f',
      '3ec1a0ff-7200-4ffd-b33e-154310d66743',
      '6bead78a-fb5d-43f2-bf7a-43fef0ea61d0',
      '079b1bb7-195d-4b9e-943c-0356bc96b2a9',
      '916c3b77-e2fe-42cd-bb06-285a903540d9',
      'c6632216-fe28-49e2-b4fa-173ee3cb886a',
      '49b4bdbe-9fc4-44e6-87d0-fc72fe7a97c2',
      'c0d98d41-3d9e-4c56-ad1f-50aae05f7e85',
    ],
    more: false,
    limit: 1000,
    count: 18,
    meta: { type: 'idlist', version: '2.0' },
  });

  const networkResponse1 = JSON.stringify([
    {
      name: 'Network 1',
      meta: {
        type: 'network',
        id: '5f4f6649-41a6-478c-94ba-41f56ec74591',
      },
    },
    {
      name: 'Network 2',
      meta: {
        id: 'dec1de41-caa6-4095-b59f-84a852023c7b',
        type: 'network',
      },
    },
    {
      name: 'Network 3',
      meta: {
        id: '13c24904-ba1d-4944-8d5e-6e30c2377607',
        type: 'network',
      },
    },
    {
      name: 'Network 4',
      meta: {
        type: 'network',
        id: 'b5a94a6d-a377-4616-9382-23cde976ec3d',
      },
    },
    {
      name: 'Network 5',
      meta: {
        type: 'network',
        id: 'ff42c059-0028-43ba-a9f3-4c6b84c362c7',
      },
    },
    {
      name: 'Network 6',
      meta: {
        id: 'b62439fd-0266-44f0-88e1-5de96d970aa0',
        type: 'network',
      },
    },
    {
      name: 'Network 7',
      meta: {
        id: '981088a8-6abf-46de-b675-14aba6d2907b',
        type: 'network',
      },
    },
    {
      name: 'Network 8',
      meta: {
        type: 'network',
        id: '6b8bd990-f3df-4e4d-bce2-bd65ab68a378',
      },
    },
    {
      name: 'Network 9',
      meta: {
        type: 'network',
        id: '335b87c2-e21c-43f5-b763-51b51b55f23b',
      },
    },
    {
      name: 'Network 10',
      meta: {
        type: 'network',
        id: '26b19be3-d7a4-4961-8544-b57700d55eaa',
      },
    },
  ]);

  const networkResponse2 = JSON.stringify([
    {
      name: 'Network 11',
      meta: {
        type: 'network',
        id: '11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f',
      },
    },
    {
      name: 'Network 12',
      meta: {
        id: '3ec1a0ff-7200-4ffd-b33e-154310d66743',
        type: 'network',
      },
    },
    {
      name: 'Network 13',
      meta: {
        id: '6bead78a-fb5d-43f2-bf7a-43fef0ea61d0',
        type: 'network',
      },
    },
    {
      name: 'Network 14',
      meta: {
        type: 'network',
        id: '079b1bb7-195d-4b9e-943c-0356bc96b2a9',
      },
    },
    {
      name: 'Network 15',
      meta: {
        type: 'network',
        id: '916c3b77-e2fe-42cd-bb06-285a903540d9',
      },
    },
    {
      name: 'Network 16',
      meta: {
        id: 'c6632216-fe28-49e2-b4fa-173ee3cb886a',
        type: 'network',
      },
    },
    {
      name: 'Network 17',
      meta: {
        id: '49b4bdbe-9fc4-44e6-87d0-fc72fe7a97c2',
        type: 'network',
      },
    },
    {
      name: 'Network 18',
      meta: {
        type: 'network',
        id: 'c0d98d41-3d9e-4c56-ad1f-50aae05f7e85',
      },
    },
  ]);

  const url = '/network';
  let cache = true;
  const size = 10;

  beforeEach(() => {
    fetch.resetMocks();
  });

  describe('without url', () => {
    const { result } = renderHook(
      () =>
        useStorePagination({
          url: undefined,
          useCache: cache,
          pageSize: size,
        }),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    it('can not render', async () => {
      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not add an item to the first page', async () => {
      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '589896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test',
        });
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not switch to page 2', async () => {
      await act(async () => {
        await result.current.setPage(2);
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not update an item', async () => {
      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not remove an item', async () => {
      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('with error', () => {
    it('can not render', async () => {
      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not add an item to the first page', async () => {
      const { result } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '689896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test',
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not switch to page 2', async () => {
      const { result } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      await act(async () => {
        await result.current.setPage(2);
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not update an item', async () => {
      const { result } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not remove an item', async () => {
      const { result } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('with cache', () => {
    cache = true;

    it('can render', async () => {
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse1);

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: cache,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(result.current.status).toBe('pending');
      expect(result.current.count).toBe(0);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items).toEqual([]);
      expect(result.current.itemIds).toEqual([]);

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.items[0].name).toEqual('Network 1');
      expect(result.current.items[9].name).toEqual('Network 10');
      expect(result.current.itemIds[0]).toEqual('5f4f6649-41a6-478c-94ba-41f56ec74591');
      expect(result.current.itemIds[9]).toEqual('26b19be3-d7a4-4961-8544-b57700d55eaa');
    });

    it('can add an item to the first page', async () => {
      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: cache,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(result.current.status).toBe('pending');

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('success');

      fetch.mockResponseOnce(networkResponse2);

      await act(async () => {
        const newItem = {
          meta: { type: 'network', id: '789896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'Added Network',
        };

        await store.dispatch(addEntities('network', newItem, { reset: false }));
        await result.current.addItem(newItem);
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);
      expect(result.current.items[0].name).toEqual('Added Network');
      expect(result.current.items[9].name).toEqual('Network 9');
      expect(result.current.itemIds[0]).toEqual('789896c6-c4ae-46cf-9352-1148f4e339e4');
      expect(result.current.itemIds[9]).toEqual('335b87c2-e21c-43f5-b763-51b51b55f23b');
    });

    it('can switch to page 2', async () => {
      fetch.mockResponseOnce(networkResponse2).mockResponseOnce(idResponse);
      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: true,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(result.current.status).toBe('pending');
      expect(result.current.count).toBe(0);

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('success');

      await act(async () => {
        await result.current.setPage(2);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(9);
      expect(result.current.itemIds.length).toEqual(9);
      expect(result.current.items[0].name).toEqual('Network 10');
      expect(result.current.itemIds[8]).toEqual('c0d98d41-3d9e-4c56-ad1f-50aae05f7e85');

      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '889896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'add item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(20);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(20);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(9);
      expect(result.current.itemIds.length).toEqual(9);
    });
  });

  describe('without cache', () => {
    it('can render', async () => {
      cache = false;
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse1);

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: cache,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(result.current.status).toBe('pending');
      expect(result.current.count).toBe(0);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items).toEqual([]);
      expect(result.current.itemIds).toEqual([]);

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.items[0].name).toEqual('Network 1');
      expect(result.current.items[9].name).toEqual('Network 10');
      expect(result.current.itemIds[0]).toEqual('5f4f6649-41a6-478c-94ba-41f56ec74591');
      expect(result.current.itemIds[9]).toEqual('26b19be3-d7a4-4961-8544-b57700d55eaa');

      await act(async () => {
        const newItem = {
          meta: { type: 'network', id: '989896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'Added Network',
        };

        await store.dispatch(addEntities('network', newItem, { reset: false }));
        await result.current.addItem(newItem);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse2);

      await act(async () => {
        await result.current.setPage(2);
      });

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(result.current.items[0].name).toEqual('Network 11');
      expect(result.current.items[7].name).toEqual('Network 18');
      expect(result.current.itemIds[0]).toEqual('11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f');
      expect(result.current.itemIds[7]).toEqual('c0d98d41-3d9e-4c56-ad1f-50aae05f7e85');

      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse2);

      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '089896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'add item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(6);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);

      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(6);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);

      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item',
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(6);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);
    });

    it('can load a device', async () => {
      const response1 = JSON.stringify({
        count: 1,
        more: false,
        limit: 1000,
        meta: { type: 'idlist', version: '2.0' },
        child: [{ type: 'device', version: '2.0' }],
        id: ['b3a829a4-6ec2-43ec-8aac-e4640cb58f6c'],
      });
      let path = '/network/6e1d786f-4029-42ae-8ece-95bb31b0bcd0';
      path += '/device/b3a829a4-6ec2-43ec-8aac-e4640cb58f6c';
      const response2 = JSON.stringify([
        {
          status: [],
          value: ['60bfe4d1-9976-4373-8e38-87d4af8576ba'],
          name: 'Find Device',
          meta: {
            type: 'device',
            version: '2.0',
            manufacturer: '7ff2124c-2af9-4498-92b6-21d00f97cc90',
            owner: 'f770df28-d063-493a-9e51-9eb1c75bfb9c',
            id: 'b3a829a4-6ec2-43ec-8aac-e4640cb58f6c',
            iot: false,
            application: '916d2a44-0981-4786-8001-d1eda497e12b',
            created: '2022-05-18T07:31:57.399850Z',
            updated: '2022-05-18T07:31:57.516300Z',
            revision: 2,
            changed: '2022-05-18T07:31:57.751548Z',
            size: 1252,
            path,
            parent: '6e1d786f-4029-42ae-8ece-95bb31b0bcd0',
            name_by_user: 'Find Device',
            tag_by_user: [],
            connection: { timestamp: '2022-05-18T07:31:57.310931Z', online: false },
            stable_connection: { timestamp: '2022-05-18T07:31:57.310931Z', online: false },
            tag: [],
          },
        },
      ]);

      cache = false;
      fetch.mockResponseOnce(response1).mockResponseOnce(response2);
      const deviceUrl = '/network/6e1d786f-4029-42ae-8ece-95bb31b0bcd0/device';

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useStorePagination({
            url: deviceUrl,
            useCache: cache,
            pageSize: size,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(result.current.status).toBe('pending');
      expect(result.current.count).toBe(0);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items).toEqual([]);
      expect(result.current.itemIds).toEqual([]);

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(1);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(1);
      expect(result.current.itemIds.length).toEqual(1);
    });
  });
});
