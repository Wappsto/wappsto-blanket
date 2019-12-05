import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { updateStream } from '../util';
import usePrevious from './usePrevious';

const arrDiff = (a1=[], a2=[]) => {
  const diff = [];
  a1.forEach(item => {
    if(!a2.find(item2 => item2.meta.id === item.meta.id)){
      diff.push(item);
    }
  });
  return diff;
}

const useSubscribe = (items) => {
  const dispatch = useDispatch();
  const arr = useMemo(() => items ? (items.constructor === Array ? items : [items]) : [], [items]);
  const previousArr = usePrevious(arr);

  // subscribe to stream
  useEffect(() => {
    const diff = arrDiff(arr, previousArr);
    if(diff.length > 0){
      updateStream(dispatch, diff.map(item => '/' + item.meta.type + '/' + item.meta.id), 'add');
    }
    return () => {
      const diff = arrDiff(previousArr, arr);
      if(diff.length > 0){
        updateStream(dispatch, diff.map(item => '/' + item.meta.type + '/' + item.meta.id), 'remove');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    return () => {
      if(arr.length > 0){
        updateStream(dispatch, arr.map(item => '/' + item.meta.type + '/' + item.meta.id), 'remove');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useSubscribe;
