import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeRequestSelector } from 'wappsto-redux/selectors/request';

const useRequestSelector = () =>  {
  const [ requestId, setRequestId ] = useState();
  const getRequest = useMemo(makeRequestSelector, []);
  const request = useSelector(state => getRequest(state, requestId));
  return { request, requestId, setRequestId };
}

export default useRequestSelector;
