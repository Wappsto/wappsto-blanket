import { useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeRequestSelector } from 'wappsto-redux/selectors/request';
import { makeRequest } from 'wappsto-redux/actions/request';

const useRequestSelector = () =>  {
  const [ requestId, setRequestId ] = useState();
  const getRequest = useMemo(makeRequestSelector, []);
  const request = useSelector(state => getRequest(state, requestId));
  const dispatch = useDispatch();
  const send = useCallback((...args) => {
    const newId = dispatch(makeRequest(...args));
    setRequestId(newId);
  }, [dispatch]);
  return { request, requestId, setRequestId, send };
}

export default useRequestSelector;
