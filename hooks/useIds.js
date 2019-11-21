import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { makeRequest, removeRequest } from 'wappsto-redux/actions/request';
import { setItem } from 'wappsto-redux/actions/items';
import { makeEntitiesSelector } from 'wappsto-redux/selectors/entities';
import { makeItemSelector } from 'wappsto-redux/selectors/items';
import usePrevious from '../hooks/usePrevious';
import useRequest from '../hooks/useRequest';

const itemName = 'useIds_status';
const cache = {};

const setCacheStatus = (dispatch, ids, status) => {
  ids.forEach(id => cache[id] = status);
  dispatch(setItem(itemName, { ...cache }));
}

function useIds(service, ids, query){
  const ownRequest = useRef(false);
  const [ status, setStatus ] = useState('idle');
  const prevStatus = usePrevious(status);
  const prevIds = usePrevious(ids);
  const missingIds = useRef();
  const dispatch = useDispatch();
  const [ items, setItems] = useState([]);
  const getEntities = useMemo(makeEntitiesSelector, []);
  const getItem = useMemo(makeItemSelector, []);
  const cacheItems = useSelector(state => getEntities(state, service, { filter: ids.map(id => ({ meta: { id: id } }))}));
  const idsStatus = useSelector(state => getItem(state, itemName));

  const updateMissingIds = useCallback(() => {
    const arr = [];
    const cacheIds = [];
    ids.forEach(id => {
      const found = cacheItems.find(item => item.meta.id === id);
      if(found){
        cacheIds.push(id);
      } else {
        if(!cache[id] || cache[id] === 'error'){
          arr.push(id);
        }
      }
    });
    missingIds.current = arr;
    if(cacheIds.length > 0){
      setCacheStatus(dispatch, cacheIds, 'success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const { request, requestId, setRequestId } = useRequest();

  // Update cache when request is over
  useEffect(() => {
    if(request && ownRequest.current){
      setCacheStatus(dispatch, missingIds.current, request.status);
      if(request.status !== 'pending'){
        ownRequest.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, request]);

  // Make request to get the ids
  useEffect(() => {
    updateMissingIds();
    if(missingIds.current.length > 0){
      setCacheStatus(dispatch, missingIds.current, 'pending');
      ownRequest.current = true;
      dispatch(removeRequest(requestId));
      const lastRequestId = dispatch(makeRequest({
        method: 'GET',
        url: '/' + service,
        query: {
          ...query,
          id: missingIds.current
        }
      }));
      setRequestId(lastRequestId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, service, updateMissingIds, ids]);

  // Update status
  useEffect(() => {
    if(status !== 'success' || prevIds !== ids){
      for(let i = 0; i < ids.length; i++){
        const idStatus = cache[ids[i]];
        if(idStatus === 'error'){
          setStatus('error');
          return;
        } else if(idStatus === 'pending'){
          setStatus('pending');
          return;
        }
      }
      setStatus('success');
    } else if(prevStatus !== 'success' && status === 'success'){
      setItems(cacheItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, idsStatus, status]);

  useEffect(() => {
    if(status === 'success'){
      setItems(cacheItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheItems]);

  return { items, status };
}

export default useIds;
