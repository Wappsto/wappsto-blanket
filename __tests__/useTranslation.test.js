import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'jest-fetch-mock';
import { useTranslation } from '../src';

describe('useTranslation', () => {
  fetchMock.enableMocks();

  const t = (str) => str;

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('can translate', () => {
    const { result } = renderHook(() => useTranslation(t));
    const str = result.current.t('test');

    expect(str).toEqual('test');
  });

  it('can translate and captilize', () => {
    const { result } = renderHook(() => useTranslation(t));
    const str = result.current.tC('test');
    const empty = result.current.tC();

    expect(str).toEqual('Test');
    expect(empty).toEqual('');
  });

  it('can translate and captilize each', () => {
    const { result } = renderHook(() => useTranslation(t));
    const str = result.current.tCE('test test');
    const empty = result.current.tCE();

    expect(str).toEqual('Test Test');
    expect(empty).toEqual('');
  });

  it('can translate and uppercase', () => {
    const { result } = renderHook(() => useTranslation(t));
    const str = result.current.tU('test');
    const empty = result.current.tU();

    expect(str).toEqual('TEST');
    expect(empty).toEqual('');
  });
});
