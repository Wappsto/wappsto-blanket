import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  makeRequestSelector,
  makeRequest,
  removeRequest as removeStoreRequest,
} from 'wappsto-redux';
import { randomID } from '../util';

export default function useRequest(id, removeOldRequest) {
  const dispatch = useDispatch();
  const [requestId, setRequestId] = useState(() => id || randomID());
  const getRequest = useMemo(makeRequestSelector, []);
  const request = useSelector((state) => getRequest(state, requestId));

  const removeRequest = useCallback(() => {
    dispatch(removeStoreRequest(requestId));
  }, [dispatch, requestId]);

  const send = useCallback(
    (obj) => dispatch(makeRequest({ ...obj, id: requestId })),
    [dispatch, requestId],
  );

  useEffect(
    () => () => {
      if ((removeOldRequest && requestId) || (!id && removeOldRequest !== false)) {
        removeRequest();
      }
    },
    [removeOldRequest, requestId, removeRequest, id],
  );

  return { request, requestId, setRequestId, send, removeRequest };
}
