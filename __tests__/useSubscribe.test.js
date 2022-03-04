/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import WS from 'jest-websocket-mock';
import { useSubscribe } from '../src';

describe('useSubscribe', () => {
  let server;

  beforeEach(() => {
    server = new WS('ws://localhost/services/2.0/websocket/open', { jsonProtocol: true });
  });

  afterEach(() => {
    WS.clean();
  });

  it('can subscribe', async () => {
    const store = new configureStore();
    const networkType = 'network';
    const networkIds = 'network_id';
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({type, ids}) => useSubscribe(type, ids),
      {
        initialProps: { type: networkType, ids: networkIds },
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
    rerender({ids: undefined});

    await expect(server).toReceiveMessage(expect.objectContaining({
      jsonrpc: "2.0",
      method: "PATCH",
      params: {"data": [], "url": "/services/2.0/websocket/open/subscription"}}));

    rerender({type: networkType, ids: ['network_id_2', 'network_id_3']});

    await expect(server).toReceiveMessage(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'PATCH',
        params: {
          data: ['/network/network_id_2', '/network/network_id_3'],
          url: '/services/2.0/websocket/open/subscription'
        }
      })
    );

    rerender({type: networkType, ids: ['network_id_2', 'network_id_3']});

    rerender({type: networkType, ids: []});

    await expect(server).toReceiveMessage(expect.objectContaining({
      jsonrpc: "2.0",
      method: "PATCH",
      params: {"data": [], "url": "/services/2.0/websocket/open/subscription"}}));
  });
});
