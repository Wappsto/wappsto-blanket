import { useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import usePrevious from './usePrevious';
import { updateStream } from '../util';
import * as cache from 'wappsto-redux/globalCache';

const cacheKey = 'useAlwaysSubscribe';
cache.initialize(cacheKey, {});

const useAlwaysSubscribe = (items) => {
  const dispatch = useDispatch();
  const arr = useMemo(() => {
    const result = [];
    const allItems = items ? (items.constructor === Array ? items : [items]) : [];
    const currentCache = cache.get(cacheKey);
    allItems.forEach(item => {
      const itemPath = '/' + item.meta.type + '/' + item.meta.id;
      if(!currentCache[itemPath]){
        currentCache[itemPath] = true;
        result.push(itemPath);
      }
    });
    return result;
  }, [items]);
  const prevArr = usePrevious(arr);

  // subscribe to stream
  useEffect(() => {
    //remove old subscriptions
    if(prevArr){
      const currentCache = cache.get(cacheKey);
      prevArr.forEach(itemPath => {
        delete currentCache[itemPath];
      });
      updateStream(dispatch, prevArr, 'remove');
    }

    //add new subscriptions
    updateStream(dispatch, arr, 'add');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
}

export default useAlwaysSubscribe;
