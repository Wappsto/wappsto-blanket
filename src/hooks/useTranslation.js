import { useCallback } from 'react';

const useTranslation = (t) => {
  // translate + Capitalize
  const tC = useCallback((str, options) => {
    const newStr = str ? t(str, options) : '';
    return newStr.charAt(0).toUpperCase() + newStr.slice(1);
  }, [t]);

  // translate + Capitalize Each
  const tCE = useCallback((str, options) => {
    const newStr = str ? t(str, options) : '';
    return newStr.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
  }, [t]);

  // translate + Uppercase
  const tU = useCallback((str, options) => {
    const newStr = str ? t(str, options) : '';
    return newStr.toUpperCase();
  }, [t]);

  return { t, tC, tCE, tU };
};

export default useTranslation;
