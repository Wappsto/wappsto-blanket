import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useStorePagination } from '../src';

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
      'c0d98d41-3d9e-4c56-ad1f-50aae05f7e85'
    ],
    more: false,
    limit: 1000,
    count: 18,
    meta: { type: 'idlist', version: '2.0' }
  });

  const networkResponse1 = JSON.stringify([
    {
      name: 'Network Name',
      meta: {
        type: 'network',
        id: '5f4f6649-41a6-478c-94ba-41f56ec74591'
      }
    },
    {
      name: 'Test',
      meta: {
        id: 'dec1de41-caa6-4095-b59f-84a852023c7b',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        id: '13c24904-ba1d-4944-8d5e-6e30c2377607',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: 'b5a94a6d-a377-4616-9382-23cde976ec3d'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: 'ff42c059-0028-43ba-a9f3-4c6b84c362c7'
      }
    },
    {
      name: 'Test',
      meta: {
        id: 'b62439fd-0266-44f0-88e1-5de96d970aa0',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        id: '981088a8-6abf-46de-b675-14aba6d2907b',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: '6b8bd990-f3df-4e4d-bce2-bd65ab68a378'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: '335b87c2-e21c-43f5-b763-51b51b55f23b'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: '26b19be3-d7a4-4961-8544-b57700d55eaa'
      }
    }
  ]);

  const networkResponse2 = JSON.stringify([
    {
      name: 'Network Name',
      meta: {
        type: 'network',
        id: '11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f'
      }
    },
    {
      name: 'Test',
      meta: {
        id: '3ec1a0ff-7200-4ffd-b33e-154310d66743',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        id: '6bead78a-fb5d-43f2-bf7a-43fef0ea61d0',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: '079b1bb7-195d-4b9e-943c-0356bc96b2a9'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: '916c3b77-e2fe-42cd-bb06-285a903540d9'
      }
    },
    {
      name: 'Test',
      meta: {
        id: 'c6632216-fe28-49e2-b4fa-173ee3cb886a',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        id: '49b4bdbe-9fc4-44e6-87d0-fc72fe7a97c2',
        type: 'network'
      }
    },
    {
      name: 'Test',
      meta: {
        type: 'network',
        id: 'c0d98d41-3d9e-4c56-ad1f-50aae05f7e85'
      }
    }
  ]);

  const networkRequest1 =
    '/services/network?from_last=true&verbose=true&order_by=this_meta.created&expand=0&limit=1000&id=%5B5f4f6649-41a6-478c-94ba-41f56ec74591%2Cdec1de41-caa6-4095-b59f-84a852023c7b%2C13c24904-ba1d-4944-8d5e-6e30c2377607%2Cb5a94a6d-a377-4616-9382-23cde976ec3d%2Cff42c059-0028-43ba-a9f3-4c6b84c362c7%2Cb62439fd-0266-44f0-88e1-5de96d970aa0%2C981088a8-6abf-46de-b675-14aba6d2907b%2C6b8bd990-f3df-4e4d-bce2-bd65ab68a378%2C335b87c2-e21c-43f5-b763-51b51b55f23b%2C26b19be3-d7a4-4961-8544-b57700d55eaa%5D';
  const networkRequest2 =
    '/services/network?from_last=true&verbose=true&order_by=this_meta.created&expand=0&limit=1000&id=%5B11c73ade-ddf0-4bd1-8ad5-c3d05dd1dd1f%2C3ec1a0ff-7200-4ffd-b33e-154310d66743%2C6bead78a-fb5d-43f2-bf7a-43fef0ea61d0%2C079b1bb7-195d-4b9e-943c-0356bc96b2a9%2C916c3b77-e2fe-42cd-bb06-285a903540d9%2Cc6632216-fe28-49e2-b4fa-173ee3cb886a%2C49b4bdbe-9fc4-44e6-87d0-fc72fe7a97c2%2Cc0d98d41-3d9e-4c56-ad1f-50aae05f7e85%5D';

  const url = '/network';
  let cache = true;
  const size = 10;

  beforeEach(() => {
    fetch.resetMocks();
  });

  describe('without url', () => {
    let result;

    it('can not render', async () => {
      const res = renderHook(
        () =>
          useStorePagination({
            url: undefined,
            useCache: cache,
            pageSize: size
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      result = res.result;

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not add an item to the first page', async () => {
      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test'
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
          name: 'update item'
        });
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not remove an item', async () => {
      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(result.current.status).toBe('idle');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('with error', () => {
    let result;
    let waitForNextUpdate;

    it('can not render', async () => {
      const res = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: false,
            pageSize: size
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      result = res.result;
      waitForNextUpdate = res.waitForNextUpdate;

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not add an item to the first page', async () => {
      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test'
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not switch to page 2', async () => {
      await act(async () => {
        await result.current.setPage(2);
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('can not update an item', async () => {
      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can not remove an item', async () => {
      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(result.current.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('with cache', () => {
    let result;
    let waitForNextUpdate;

    it('can render', async () => {
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse1);

      const res = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: cache,
            pageSize: size
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      result = res.result;
      waitForNextUpdate = res.waitForNextUpdate;

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
      expect(result.current.items[0].name).toEqual('Network Name');
      expect(result.current.itemIds[9]).toEqual('26b19be3-d7a4-4961-8544-b57700d55eaa');
    });

    it('can add an item to the first page', async () => {
      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test'
        });
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('can switch to page 2', async () => {
      fetch.mockResponseOnce(networkResponse2).mockResponseOnce(idResponse);

      await act(async () => {
        await result.current.setPage(2);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);

      expect(result.current.items[0].name).toEqual('Network Name');
      expect(result.current.itemIds[7]).toEqual('c0d98d41-3d9e-4c56-ad1f-50aae05f7e85');
    });

    it('can add an item to the second page', async () => {
      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'add item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(9);
      expect(result.current.itemIds.length).toEqual(9);
    });

    it('can update an item', async () => {
      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(19);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(9);
      expect(result.current.itemIds.length).toEqual(9);
    });

    it('can remove an item', async () => {
      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);
    });
  });

  describe('without cache', () => {
    let result;
    let waitForNextUpdate;

    it('can render', async () => {
      cache = false;
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse1);

      const res = renderHook(
        () =>
          useStorePagination({
            url,
            useCache: cache,
            pageSize: size
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      result = res.result;
      waitForNextUpdate = res.waitForNextUpdate;

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
      expect(result.current.items[0].name).toEqual('Network Name');
      expect(result.current.itemIds[9]).toEqual('26b19be3-d7a4-4961-8544-b57700d55eaa');
    });

    it('can add an item to the first page', async () => {
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse1);

      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'test'
        });
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(10);
      expect(result.current.itemIds.length).toEqual(10);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('can switch to page 2', async () => {
      fetch.mockResponseOnce(idResponse).mockResponseOnce(networkResponse2);

      await act(async () => {
        await result.current.setPage(2);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.items[0].name).toEqual('Network Name');
      expect(result.current.itemIds[7]).toEqual('c0d98d41-3d9e-4c56-ad1f-50aae05f7e85');
    });

    it('can add an item to the second page', async () => {
      fetch.mockResponseOnce(idResponse);

      await act(async () => {
        await result.current.addItem({
          meta: { type: 'network', id: '489896c6-c4ae-46cf-9352-1148f4e339e4' },
          name: 'add item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);
    });

    it('can update an item', async () => {
      await act(async () => {
        await result.current.updateItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);
    });

    it('can remove an item', async () => {
      await act(async () => {
        await result.current.removeItem({
          meta: { type: 'network', id: '26b19be3-d7a4-4961-8544-b57700d55eaa' },
          name: 'update item'
        });
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(result.current.status).toBe('success');
      expect(result.current.count).toBe(18);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.items.length).toEqual(8);
      expect(result.current.itemIds.length).toEqual(8);
    });
  });
});
