import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeEntitiesSelector } from 'wappsto-redux';

export function useEntitiesSelector(type, options) {
  const getEntities = useMemo(makeEntitiesSelector, []);
  const entities = useSelector((state) => getEntities(state, type, options));
  return entities;
}
