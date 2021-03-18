import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateStream } from '../util';
import equal from 'deep-equal';

const useSubscribe = (type, ids) => {
  const dispatch = useDispatch();
  const cached = useRef([]);
  const arr = useMemo(() => {
    let arr;
    if(ids){
      if(ids.constructor === Array){
        arr = ids.map(id => '/' + type + '/' + id)
      } else {
        arr = ['/' + type + '/' + ids];
      }
    }
    if(!equal(arr, cached.current)){
      cached.current = arr;
    }
    return cached.current;
  }, [type, ids]);

  // subscribe to stream
  useEffect(() => {
    if(arr){
      updateStream(dispatch, arr, 'add');
    }
    return () => {
      if(arr){
        updateStream(dispatch, arr, 'remove');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arr]);
}

export default useSubscribe;
