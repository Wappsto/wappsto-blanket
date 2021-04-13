import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItem } from 'wappsto-redux/actions/items';
import { getSession } from 'wappsto-redux/selectors/session';
import { makeItemSelector } from 'wappsto-redux/selectors/items';
import { getServiceUrl } from '../util';
import axios from 'axios';

const CancelToken = axios.CancelToken;

export const STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELED: 'canceled'
};

function useMetrics(id){
  const dispatch = useDispatch();
  const getItem = useMemo(makeItemSelector, []);
  const itemName = 'metrics_cache_'+id;
  const cachedData = useSelector(state => getItem(state, itemName));
  const activeSession = useSelector(state => getSession(state));
  const [ data, setData ] = useState(cachedData);
  const savedStatus = cachedData ? STATUS.SUCCESS : STATUS.IDLE;
  const cachedStatus = useRef(savedStatus);
  const [ status, setStatus ] = useState(savedStatus);
  const cancelFunc = useRef();
  const isCanceled = useRef(false);
  const unmounted = useRef(false);

  const setCurrentStatus = (status) => {
    cachedStatus.current = status;
    setStatus(status);
  }

  const getData = useCallback(async (begin, end, resolution) => {
    if(!begin || !end || !resolution){
      return;
    }
    if(begin.constructor === Date){
      begin = begin.toISOString();
    }
    if(end.constructor === Date){
      end = end.toISOString();
    }
    if(cachedStatus.current === STATUS.PENDING && cancelFunc.current){
      cancelFunc.current('Operation canceled');
    }
    setData();
    dispatch(setItem(itemName, undefined));
    setCurrentStatus(STATUS.PENDING);
    isCanceled.current = false;
    try{
      const body = {
        operation: "count_online_iot",
        query: {
          begin: begin,
          end: end,
          resolution: resolution,
        }
      };
      const result = await axios.post(
        getServiceUrl('metrics'),
        body,
        {
          headers: { "x-session": activeSession.meta.id },
          cancelToken: new CancelToken(function executor(cancel) {
            cancelFunc.current = cancel;
          })
        }
      );
      if(unmounted.current){
        return;
      }
      if(result.status !== 200){
        throw new Error("error");
      }
      if(!isCanceled.current){
        setData(result.data);
        dispatch(setItem(itemName, result.data));
      }
      setCurrentStatus(STATUS.SUCCESS);
    } catch(e){
      if(unmounted.current){
        return;
      }
      setCurrentStatus(STATUS.ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      unmounted.current = true;
    }
  }, []);

  const cancel = useCallback(() => {
    if(cancelFunc.current){
      cancelFunc.current('Operation canceled');
    }
    if(!isCanceled.current){
      setData();
      dispatch(setItem(itemName, undefined));
      setCurrentStatus(STATUS.CANCELED);
      isCanceled.current = true;
    }
  }, [dispatch, itemName]);

  const reset = useCallback(() => {
    if(cancelFunc.current){
      cancelFunc.current('Operation canceled');
    }
    setData();
    dispatch(setItem(itemName, undefined));
    setCurrentStatus(STATUS.IDLE);
    isCanceled.current = false;
  }, [dispatch, itemName]);

  return { data, status, getData, reset, cancel };
}

export default useMetrics;
