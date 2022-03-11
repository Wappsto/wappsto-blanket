/**
 * @jest-environment jest-environment-jsdom-global
 */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore, trigger } from 'wappsto-redux';
import WS from 'jest-websocket-mock';
import { usePathSubscribe } from '../src';

describe('usePathSubscribe', () => {
  let server;

  beforeEach(() => {
    server = new WS('ws://localhost/services/2.0/websocket/open', { jsonProtocol: true });
  });

  afterEach(() => {
    WS.clean();
  });

  it('runs correctly', async () => {
    const store = new configureStore();
    const networkItem = [
      {
        meta: {
          type: 'network',
          id: 'network_id'
        },
        name: 'network name'
      }
    ];
    const networkItem2 = {
      meta: {
        type: 'network',
        id: 'network_id_2'
      },
      name: 'network name 2'
    };
    const networkItem3 = [
      {
        meta: {
          type: 'network',
          id: 'network_id_3'
        },
        name: 'network name 3'
      }
    ];
    const cId = 'cId';

    const { rerender, unmount } = renderHook(
      ({ items, cacheId }) => usePathSubscribe(items, cacheId),
      {
        initialProps: { items: networkItem, cacheId: cId },
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );

    await server.connected;
    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: { data: ['/network/network_id'], url: '/services/2.0/websocket/open/subscription' }
      })
    );

    rerender({ items: networkItem2, cacheId: cId });

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: ['/network/network_id', '/network/network_id_2'],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );

    rerender({ items: networkItem3, cacheId: 'id2' });

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: ['/network/network_id', '/network/network_id_2', '/network/network_id_3'],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );

    rerender({ items: undefined, cacheId: 'id3' });

    //

    rerender({ items: networkItem3 });

    global.jsdom.reconfigure({
      url: 'https://wappsto.com/service'
    });

    trigger('logout');

    unmount();
  });
});
