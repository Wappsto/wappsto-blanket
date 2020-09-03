import { useMemo } from 'react';
import { makeEntitySelector } from 'wappsto-redux/selectors/entities';

const useEntitySelector = (type) =>  useMemo(() => {
  const getEntity = makeEntitySelector();
  return (state, options) => getEntity(state, type, options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

export default useEntitySelector;
