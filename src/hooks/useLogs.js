import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import qs from 'qs';
import equal from 'deep-equal';
import { onLogout, makeRequest } from 'wappsto-redux';
import { STATUS } from '../util';

let cache = {};
onLogout(() => (cache = {}));

export default function useLogs(stateId, sessionId, cacheId) {
  const [data, setData] = useState([]);
  const cachedData = useRef([]);
  const cachedStatus = useRef(STATUS.IDLE);
  const isCanceled = useRef(false);
  const [status, setStatus] = useState(STATUS.IDLE);
  const dispatch = useDispatch();
  const cancelFunc = useRef();
  const unmounted = useRef(false);

  const setCurrentStatus = (currentStatus) => {
    cachedStatus.current = currentStatus;
    setStatus(currentStatus);
  };

  const getLogs = useCallback(
    async (options) => {
      if (!stateId) {
        throw new Error('stateId is not defined');
      }
      const cOptions = { ...options };
      if (!cOptions.start || !cOptions.end) {
        return;
      }
      if (cacheId && cache[cacheId] && equal(cache[cacheId].options, options)) {
        setData(cache[cacheId].data);
        setCurrentStatus(cache[cacheId].status);
        return;
      }
      if (cOptions.start.constructor === Date) {
        cOptions.start = cOptions.start.toISOString();
      }
      if (cOptions.end.constructor === Date) {
        cOptions.end = cOptions.end.toISOString();
      }
      if (cachedStatus.current === STATUS.IDLE) {
        setData([]);
        setCurrentStatus(STATUS.PENDING);
        isCanceled.current = false;
        cachedData.current = [];
        let more = true;
        try {
          while (more && !isCanceled.current && (cacheId || (!cacheId && !unmounted.current))) {
            if (cachedData.current.length > 0) {
              const last = cachedData.current[cachedData.current.length - 1];
              cOptions.start = last.time || last.selected_timestamp;
            }
            const url = `/log/${stateId}?type=state${
              cOptions.limit ? '' : '&limit=3600'
            }&${qs.stringify(cOptions)}`;
            const controller = new AbortController();
            cancelFunc.current = controller.abort;
            const result = await dispatch(
              makeRequest({
                url,
                method: 'GET',
                signal: controller.signal,
                dispatchEntities: false,
                headers: {
                  'x-session': sessionId,
                },
              }),
            );
            cancelFunc.current = null;
            if (!result.ok || !result.json) {
              throw new Error('error');
            }
            cachedData.current = cachedData.current.concat(result.json.data);
            more = result.json.more && (!cOptions.limit || result.json.length < cOptions.limit);
          }
          if (cacheId) {
            cache[cacheId] = {
              data: cachedData.current,
              options,
              status: STATUS.SUCCESS,
            };
          }
          if (unmounted.current) {
            return;
          }
          if (!isCanceled.current) {
            setData(cachedData.current);
          }
          setCurrentStatus(STATUS.SUCCESS);
        } catch (e) {
          cancelFunc.current = null;
          if (cacheId) {
            cache[cacheId] = {
              data: cachedData.current,
              options,
              status: STATUS.ERROR,
            };
          }
          if (unmounted.current) {
            return;
          }
          if (!isCanceled.current) {
            setData(cachedData.current);
          }
          setCurrentStatus(STATUS.ERROR);
        }
      }
    },
    [cacheId, dispatch, sessionId, stateId],
  );

  useEffect(
    () => () => {
      unmounted.current = true;
    },
    [],
  );

  const cancel = useCallback(() => {
    if (cancelFunc.current) {
      cancelFunc.current('Operation canceled');
    }
    if (!isCanceled.current) {
      setCurrentStatus(STATUS.CANCELED);
      isCanceled.current = true;
    }
  }, []);

  const reset = useCallback(
    (resetCache = true) => {
      if (cancelFunc.current) {
        cancelFunc.current('Operation canceled');
      }
      if (cacheId && resetCache) {
        delete cache[cacheId];
      }
      setData([]);
      setCurrentStatus(STATUS.IDLE);
      isCanceled.current = false;
      cachedData.current = [];
    },
    [cacheId],
  );

  return { data, status, getLogs, reset, cancel };
}
