import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setItem } from 'wappsto-redux/actions/items';
import { makeEntitiesSelector } from 'wappsto-redux/selectors/entities';
import { makeItemSelector } from 'wappsto-redux/selectors/items';
import usePrevious from '../hooks/usePrevious';
import useRequest from '../hooks/useRequest';
import { matchArray, matchObject } from '../util';

const itemName = 'useIds_status';
const cache = {};

const setCacheStatus = (dispatch, ids, status, query) => {
  ids.forEach(id => cache[id] = { status, query });
  dispatch(setItem(itemName, { ...cache }));
}

function useIds(service, ids, query){
  const [ status, setStatus ] = useState('idle');
  const prevStatus = usePrevious(status);
  const prevIds = usePrevious(ids);
  const missingIds = useRef([]);
  const dispatch = useDispatch();
  const [ items, setItems] = useState([]);
  const getEntities = useMemo(makeEntitiesSelector, []);
  const getItem = useMemo(makeItemSelector, []);
  const cacheItems = useSelector(state => getEntities(state, service, { filter: ids.map(id => ({ meta: { id: id } }))}));
  const idsStatus = useSelector(state => getItem(state, itemName));

  const updateMissingIds = useCallback(() => {
    if(matchArray(ids, prevIds)){
      return;
    }
    const arr = [];
    const cacheIds = [];
    ids.forEach(id => {
      const cid = cache[id];
      if(cid) {
        const cidQ = {...cid.query, expand: null};
        const cQ = {...query, expand: null};
        if(!matchObject(cidQ, cQ) || cid.query.expand < query.expand || cid.status === 'error' || cid.status === 'idle'){
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

  const { request, send, removeRequest } = useRequest();

  const getMissingIds = (checkIds = true) => {
    if(checkIds && matchArray(ids, prevIds)){
      return;
    }
    const prevMissingIds = updateMissingIds();
    if(missingIds.current.length > 0){
      if(request && request.status === 'pending' && prevMissingIds.length > 0){
        setCacheStatus(dispatch, prevMissingIds, '', query);
      }
      removeRequest();
      setCacheStatus(dispatch, missingIds.current, 'pending', query);
      send({
        method: 'GET',
        url: '/' + service,
        query: {
          ...query,
          id: missingIds.current
        }
      });
    }
  }

  // Update cache when request is over
  useEffect(() => {
    if(request){
      setCacheStatus(dispatch, missingIds.current, request.status, query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // Make request to get the ids
  useEffect(() => {
    getMissingIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, service, updateMissingIds, ids]);

  // Update status
  useEffect(() => {
    if(status !== 'success' || prevIds !== ids){
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

  useEffect(() => {
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
