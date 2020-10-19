import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeRequestSelector } from 'wappsto-redux/selectors/request';
import { makeRequest, removeRequest as removeStoreRequest } from 'wappsto-redux/actions/request';
import uuidv4 from 'uuid/v4';

const useRequest = (id, removeOldRequest) =>  {
  const dispatch = useDispatch();
  const [ requestId, setRequestId ] = useState(() => {
    return id || uuidv4();
  });
  const getRequest = useMemo(makeRequestSelector, []);
  const request = useSelector(state => getRequest(state, requestId));

  const removeRequest = useCallback(() => {
    dispatch(removeStoreRequest(requestId));
  }, [dispatch, requestId]);

  const send = useCallback((obj) => {
    return dispatch(makeRequest({...obj, id: requestId}));
  }, [dispatch, requestId]);

  useEffect(() => () => {
    if((removeOldRequest && requestId) || (!id && removeOldRequest !== false)){
      removeRequest();
    }
  }, [removeOldRequest, requestId, removeRequest, id]);

  return { request, requestId, setRequestId, send, removeRequest };
}

export default useRequest;
