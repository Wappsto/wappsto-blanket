import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItem, makeItemSelector, makeRequest } from 'wappsto-redux';
import { STATUS } from '../util';

export function useMetrics(id) {
  const dispatch = useDispatch();
  const getItem = useMemo(makeItemSelector, []);
  const itemName = 'metrics_cache_' + id;
  const cachedData = useSelector((state) => getItem(state, itemName));
  const [data, setData] = useState(cachedData);
  const savedStatus = cachedData ? STATUS.SUCCESS : STATUS.IDLE;
  const cachedStatus = useRef(savedStatus);
  const [status, setStatus] = useState(savedStatus);
  const cancelFunc = useRef();
  const isCanceled = useRef(false);
  const unmounted = useRef(false);

  const setCurrentStatus = (status) => {
    cachedStatus.current = status;
    setStatus(status);
  };

  const getData = useCallback(async (begin, end, resolution) => {
    if (!begin || !end || !resolution) {
      return;
    }
    if (begin.constructor === Date) {
      begin = begin.toISOString();
    }
    if (end.constructor === Date) {
      end = end.toISOString();
    }
    if (cachedStatus.current === STATUS.PENDING && cancelFunc.current) {
      cancelFunc.current('Operation canceled');
    }
    setData();
    dispatch(setItem(itemName, undefined));
    setCurrentStatus(STATUS.PENDING);
    isCanceled.current = false;
    try {
      const body = {
        operation: 'count_online_iot',
        query: {
          begin: begin,
          end: end,
          resolution: resolution
        }
      };
      const controller = new AbortController();
      cancelFunc.current = controller.abort;
      const result = await dispatch(
        makeRequest({
          method: 'POST',
          url: '/metrics',
          signal: controller.signal,
          dispatchEntities: false,
          body
        })
      );
      cancelFunc.current = null;
      if (unmounted.current) {
        return;
      }
      if (!result.ok || !result.json) {
        throw new Error('error');
      }
      if (!isCanceled.current) {
        setData(result.json);
        dispatch(setItem(itemName, result.json));
      }
      setCurrentStatus(STATUS.SUCCESS);
    } catch (e) {
      cancelFunc.current = null;
      if (unmounted.current) {
        return;
      }
      setCurrentStatus(STATUS.ERROR);
    }
  }, []);

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  const cancel = useCallback(() => {
    if (cancelFunc.current) {
      cancelFunc.current();
    }
    if (!isCanceled.current) {
      setData();
      dispatch(setItem(itemName, undefined));
      setCurrentStatus(STATUS.CANCELED);
      isCanceled.current = true;
    }
  }, [dispatch, itemName]);

  const reset = useCallback(() => {
    if (cancelFunc.current) {
      cancelFunc.current();
    }
    setData();
    dispatch(setItem(itemName, undefined));
    setCurrentStatus(STATUS.IDLE);
    isCanceled.current = false;
  }, [dispatch, itemName]);

  return { data, status, getData, reset, cancel };
}
