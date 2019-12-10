import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { updateStream } from '../util';

const useSubscribe = (items) => {
  const dispatch = useDispatch();
  const arr = useMemo(() => items ? (items.constructor === Array ? items : [items]) : [], [items]);

  // subscribe to stream
  useEffect(() => {
    updateStream(dispatch, arr.map(item => '/' + item.meta.type + '/' + item.meta.id), 'add');
    return () => {
      updateStream(dispatch, arr.map(item => '/' + item.meta.type + '/' + item.meta.id), 'remove');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // unsubscribe on unmount
  useEffect(() => {
    return () => {
      updateStream(dispatch, arr.map(item => '/' + item.meta.type + '/' + item.meta.id), 'remove');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useSubscribe;
