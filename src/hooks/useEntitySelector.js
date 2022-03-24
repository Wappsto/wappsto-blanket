import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeEntitySelector } from 'wappsto-redux';

export default function useEntitySelector(type, options) {
  const getEntity = useMemo(makeEntitySelector, []);
  const entity = useSelector((state) => getEntity(state, type, options));
  return entity;
}
