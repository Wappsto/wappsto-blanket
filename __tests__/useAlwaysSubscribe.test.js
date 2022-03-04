/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore, trigger } from 'wappsto-redux';
import WS from 'jest-websocket-mock';
import { useAlwaysSubscribe } from '../src';

describe('useAlwaysSubscribe', () => {
  let server;

  beforeEach(() => {
    server = new WS('ws://localhost/services/2.0/websocket/open', { jsonProtocol: true });
  });

  afterEach(() => {
    WS.clean();
  });

  it('can subscribe', async () => {
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
          id: 'network_id_2'
        },
        name: 'network name 2'
      }
    ];

    const { rerender } = renderHook(({ items }) => useAlwaysSubscribe(items), {
      initialProps: { items: networkItem },
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    await server.connected;
    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: { data: ['/network/network_id'], url: '/services/2.0/websocket/open/subscription' }
      })
    );

    rerender({ items: networkItem2 });

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: ['/network/network_id_2'],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );

    rerender({ items: networkItem3 });

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: [],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );

    rerender({ items: undefined });

    trigger('logout');

    rerender({ items: networkItem3 });

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: ['/network/network_id_2'],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );
  });
});
