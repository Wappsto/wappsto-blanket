import { useTranslation as useExternalTranslation } from 'react-i18next';

const useTranslation = () => {
  // translate
  const { t } = useExternalTranslation();

  // translate + Capitalize
  function tC(str, options) {
    const newStr = str ? t(str, options) : '';
    return newStr.charAt(0).toUpperCase() + newStr.slice(1);
  }

  // translate + Capitalize Each
  function tCE(str, options) {
    const newStr = str ? t(str, options) : '';
    return newStr.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
  }

  // translate + Uppercase
  function tU(str, options) {
    const newStr = str ? t(str, options) : '';
    return newStr.toUpperCase();
  }

  return { t, tC, tCE, tU };
};

export default useTranslation;
