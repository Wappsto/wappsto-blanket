import { useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeRequestSelector } from 'wappsto-redux/selectors/request';
import { makeRequest, removeRequest as removeStoreRequest } from 'wappsto-redux/actions/request';

const useRequestSelector = () =>  {
  const dispatch = useDispatch();
  const [ requestId, setRequestId ] = useState();
  const getRequest = useMemo(makeRequestSelector, []);
  const request = useSelector(state => getRequest(state, requestId));

  const send = useCallback((...args) => {
    const newId = dispatch(makeRequest(...args));
    setRequestId(newId);
    return newId;
  }, [dispatch]);

  const removeRequest = useCallback(() => {
    dispatch(removeStoreRequest(requestId));
  }, [dispatch, requestId]);

  return { request, requestId, setRequestId, send, removeRequest };
}

export default useRequestSelector;
