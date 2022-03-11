import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from 'wappsto-redux';
import fetchMock from 'jest-fetch-mock';
import { useMetrics } from '../src';

describe('useMetrics', () => {
  fetchMock.enableMocks();
  const store = new configureStore();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('runs correctly', async () => {
    const id = 'test';
    fetch
      .mockResponseOnce(
        JSON.stringify({ name: 'metrics' })
      ).mockRejectOnce(
        JSON.stringify({ name: 'metrics' })
      )

    const { result, waitForNextUpdate, rerender, unmount } = renderHook(
      () => useMetrics(id),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData('begin', 'end', 'red');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data.name).toBe('metrics');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData(undefined, 'end', 'red');
      await result.current.getData('start', undefined, 'red');
      await result.current.getData('start', 'end', undefined);
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.getData(new Date(), new Date(), 'red');
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.cancel();
    });

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('canceled');

    unmount();

    expect(result.current.data).toBe(undefined);
    expect(result.current.status).toBe('canceled');
  });
});
