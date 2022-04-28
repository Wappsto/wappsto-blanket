import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'jest-fetch-mock';
import { useTranslation } from '../src';

describe('useTranslation', () => {
  fetchMock.enableMocks();

  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',

    // have a common namespace used around the full app
    ns: ['translationsNS'],
    defaultNS: 'translationsNS',

    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    resources: { en: { translationsNS: {} } },
  });

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('can translate', () => {
    const { result } = renderHook(() => useTranslation());
    const str = result.current.t('test');

    expect(str).toEqual('test');
  });

  it('can translate and captilize', () => {
    const { result } = renderHook(() => useTranslation());
    const str = result.current.tC('test');
    const empty = result.current.tC();

    expect(str).toEqual('Test');
    expect(empty).toEqual('');
  });

  it('can translate and uppercase', () => {
    const { result } = renderHook(() => useTranslation());
    const str = result.current.tU('test');
    const empty = result.current.tU();

    expect(str).toEqual('TEST');
    expect(empty).toEqual('');
  });
});
