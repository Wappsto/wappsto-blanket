import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useFetchItems } from '../src';

describe('useFetchItems', () => {
  fetchMock.enableMocks();
  let store = new configureStore();
  beforeEach(() => {
    fetch.resetMocks();
  });

  describe('with cache', () => {
    it('get no items', async () => {
      let objIds = [];
      let query = {};
      let useCache = true;

      const { result } = renderHook(() => useFetchItems(objIds, query, useCache), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });

      expect(result.current.status).toEqual('success');
      expect(result.current.items).toEqual({});
    });

    it('will report error on failed request', async () => {
      fetch.mockRejectOnce('error');
      let objIds = { network: ['658ef28d-d255-4394-9c6e-3199cc9e4c06'] };
      let query = {
        expand: 1
      };
      let useCache = true;

      const { result, waitForNextUpdate } = renderHook(
        () => useFetchItems(objIds, query, useCache),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.status).toEqual('error');
      expect(result.current.items).toEqual({});
    });

    it('will get a single id', async () => {
      fetch.mockResponseOnce(
        JSON.stringify([
          {
            meta: { id: '4e63ae3a-f653-410b-afb9-56e4672feca9', type: 'network' },
            name: 'Network Name'
          }
        ])
      );

      let objIds = { network: ['658ef28d-d255-4394-9c6e-3199cc9e4c06'] };
      let query = {
        expand: 1,
        from_last: false
      };
      let useCache = true;

      const { result, waitForNextUpdate } = renderHook(
        () => useFetchItems(objIds, query, useCache),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toEqual('success');
      expect(result.current.items.network.network[0].name).toEqual('Network Name');
    });

    it('will get multiple different id', async () => {
      fetch
        .mockResponseOnce(
          JSON.stringify([
            {
              meta: { id: '4e63ae3a-f653-410b-afb9-56e4672feca9', type: 'network' },
              name: 'Network Name'
            },
            {
              meta: { id: 'ace68452-f7f9-4e6b-a656-3cd0c1d70463', type: 'network' },
              name: 'Network Name 2'
            }
          ])
        )
        .mockResponseOnce(
          JSON.stringify([
            {
              meta: { id: 'ace68452-f7f9-4e6b-a656-3cd0c1d70463', type: 'application' },
              name: 'Application Name'
            }
          ])
        );

      let objIds = {
        network: ['658ef28d-d255-4394-9c6e-3199cc9e4c06', '1ed7e891-a000-49b2-8122-7bb5ba5f5559'],
        application: ['ace68452-f7f9-4e6b-a656-3cd0c1d70463']
      };
      let query = {
        expand: 1
      };
      let useCache = true;

      const { result, waitForNextUpdate } = renderHook(
        () => useFetchItems(objIds, query, useCache),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.status).toEqual('success');
      expect(result.current.items.network.network[0].name).toEqual('Network Name');
      expect(result.current.items.network.network[1].name).toEqual('Network Name 2');
      expect(result.current.items.application[0].name).toEqual('Application Name');
    });

    it('will get multiple different id', async () => {
      store = new configureStore();
      fetch.mockResponseOnce(
        JSON.stringify([
          {
            meta: { id: '4e63ae3a-f653-410b-afb9-56e4672feca9', type: 'network' },
            name: 'Network Name'
          }
        ])
      );

      let objIds = {
        network: ['4e63ae3a-f653-410b-afb9-56e4672feca9']
      };
      let query = {
        expand: 1
      };
      let useCache = true;

      const { result, waitForNextUpdate, rerender } = renderHook(
        ({ objIds, query, useCache }) => useFetchItems(objIds, query, useCache),
        {
          initialProps: { objIds: objIds, query: query, useCache: useCache },
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toEqual('success');
      expect(result.current.items.network.network[0].name).toEqual('Network Name');

      await act(async () => {
        await rerender({ objIds });
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.status).toEqual('success');
      expect(result.current.items.network.network[0].name).toEqual('Network Name');
    });
  });
});
