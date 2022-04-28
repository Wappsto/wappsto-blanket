import { useTranslation as useExternalTranslation } from 'react-i18next';

const useTranslation = () => {
  // translate
  const { t } = useExternalTranslation();

  // translate + Capitalize
  function tC(str) {
    const newStr = str ? t(str)  : '';
    return (newStr.charAt(0).toUpperCase() + newStr.slice(1));
  }

  // translate + Uppercase
  function tU(str) {
    const newStr = str ? t(str) : '';
    return newStr.toUpperCase();
  }

  function tCE(str) {
    const newStr = str ? t(str) : '';
    return newStr.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
  }

  return {t, tC, tU, tCE}
}

export default useTranslation
