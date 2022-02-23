import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useItemSelector } from './useItemSelector';
import { setItem as setReduxItem, removeItem as removeReduxItem } from 'wappsto-redux';

export function useStoreItem(id) {
  const dispatch = useDispatch();
  const item = useItemSelector(id);

  const setItem = useCallback(
    (data) => {
      dispatch(setReduxItem(id, data));
    },
    [dispatch, id]
  );

  const removeItem = useCallback(() => {
    dispatch(removeReduxItem(id));
  }, [dispatch, id]);

  return [item, setItem, removeItem];
}
