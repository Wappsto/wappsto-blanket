import { useState, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';

import { setItem } from 'wappsto-redux/actions/items';
import { makeEntitiesSelector } from 'wappsto-redux/selectors/entities';
import { makeItemSelector } from 'wappsto-redux/selectors/items';
import { getSession } from 'wappsto-redux/selectors/session';
import { startRequest } from 'wappsto-redux/actions/request';
import usePrevious from '../hooks/usePrevious';
import { ITEMS_PER_SLICE } from '../util';
import equal from 'deep-equal';
import * as globalCache from 'wappsto-redux/globalCache';

const itemName = 'useIds_status';
const cacheKey = 'useIds';
globalCache.initialize(cacheKey, {});

const setCacheStatus = (dispatch, ids, status, query) => {
  const cache = globalCache.get(cacheKey);
  ids.forEach(id => cache[id] = { status, query });
  dispatch(setItem(itemName, { ...cache }));
}

const sendGetIds = (store, ids, service, query, sliceLength) => {
  const res = [];
  const slices = Math.ceil(ids.length / sliceLength);
  for(let i = 0; i < slices; i++){
    res.push(ids.slice(i * sliceLength, (i + 1) * sliceLength));
  }
  const state = store.getState();
  const session = getSession(state);
  res.forEach(arr => {
    const options = {
      url: '/' + service,
      method: 'GET',
      query: {
        ...query,
        id: arr
      }
    }
    const promise = startRequest(store.dispatch, options, session);
    promise.then(result => {
      setCacheStatus(store.dispatch, arr, result.ok ? 'success' : 'error', query);
    }).catch(() => {
      setCacheStatus(store.dispatch, arr, 'error', query);
    });
  });
}

function useIds(service, ids, query={}, sliceLength=ITEMS_PER_SLICE){
  const store = useStore();
  const [ status, setStatus ] = useState('idle');
  const prevStatus = usePrevious(status);
  const prevIds = usePrevious(ids);
  const missingIds = useRef([]);
  const dispatch = useDispatch();
  const [ items, setItems] = useState([]);
  const getEntities = useMemo(makeEntitiesSelector, []);
  const getItem = useMemo(makeItemSelector, []);
  const cacheItems = useSelector(state => getEntities(state, service, ids));
  const idsStatus = useSelector(state => getItem(state, itemName));

  const updateMissingIds = useCallback(() => {
    if(equal(ids, prevIds)){
      return;
    }
    const arr = [];
    const cacheIds = [];
    ids.forEach(id => {
      const cid = globalCache.get(cacheKey)[id];
      if(cid) {
        const cidQ = {...cid.query, expand: null};
        const cQ = {...query, expand: null};
        if(!equal(cidQ, cQ) || cid.query.expand < query.expand || cid.status === 'error' || cid.status === 'idle'){
          arr.push(id);
        }
      } else if(!query || !query.expand || query.expand === 0){
        const found = cacheItems.find(item => item.meta.id === id);
        if(found){
          cacheIds.push(id);
        } else {
          arr.push(id);
        }
      } else {
        arr.push(id);
      }
    });
    const prevMissingIds = missingIds.current;
    missingIds.current = arr;
    if(cacheIds.length > 0){
      setCacheStatus(dispatch, cacheIds, 'success', query);
    }
    return prevMissingIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const getMissingIds = (checkIds = true) => {
    if(checkIds && equal(ids, prevIds)){
      return;
    }
    updateMissingIds();
    if(missingIds.current.length > 0){
      setCacheStatus(dispatch, missingIds.current, 'pending', query);
      sendGetIds(store, missingIds.current, service, query, sliceLength);
    }
  }

  // Make request to get the ids
  useMemo(() => {
    getMissingIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, service, updateMissingIds, ids]);

  // Update status
  useMemo(() => {
    if(status !== 'success' || prevIds !== ids){
      const cache = globalCache.get(cacheKey);
      for(let i = 0; i < ids.length; i++){
        const idStatus = cache[ids[i]] && cache[ids[i]].status;
        if(idStatus === 'error'){
          setStatus('error');
          return;
        } else if(idStatus === 'pending'){
          setStatus('pending');
          return;
        }
      }
      setStatus('success');
      setItems(cacheItems);
    } else if(prevStatus !== 'success' && status === 'success'){
      setItems(cacheItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, idsStatus]);

  useMemo(() => {
    if(status === 'success'){
      setItems(cacheItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheItems]);

  // Reset current ids cache
  const reset = useCallback(() => {
    setCacheStatus(dispatch, ids, 'idle', query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  // Refresh
  const refresh = useCallback((callReset = true) => {
    if(callReset){
      reset();
    }
    getMissingIds(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return { items, status, setStatus, reset, refresh };
}

export default useIds;
