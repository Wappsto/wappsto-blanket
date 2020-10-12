import { useState, useRef, useCallback, useEffect } from 'react';
import { getSession } from 'wappsto-redux/selectors/session';
import { useSelector } from 'react-redux';
import { getServiceUrl } from '../util';
import querystring from 'querystring';
import axios from 'axios';

const CancelToken = axios.CancelToken;

export const STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELED: 'canceled'
};

function useLogs(stateId, sessionId){
  const [ data, setData ] = useState([]);
  const cachedData = useRef([]);
  const cachedStatus = useRef(STATUS.IDLE);
  const isCanceled = useRef(false);
  const [ status, setStatus ] = useState(STATUS.IDLE);
  const activeSession = useSelector(state => getSession(state));
  const cancelFunc = useRef();
  const unmounted = useRef(false);

  const setCurrentStatus = (status) => {
    cachedStatus.current = status;
    setStatus(status);
  }

  const getLogs = useCallback(async (options) => {
    if(!stateId){
      throw new Error('stateId is not defined');
    }
    const cOptions = {...options};
    if(!cOptions.start || !cOptions.end){
      return;
    }
    if(cOptions.start.constructor === Date){
      cOptions.start = cOptions.start.toISOString();
    }
    if(cOptions.end.constructor === Date){
      cOptions.end = cOptions.end.toISOString();
    }
    if(cachedStatus.current === STATUS.IDLE){
      setData([]);
      setCurrentStatus(STATUS.PENDING);
      isCanceled.current = false;
      cachedData.current = [];
      let more = true;
      try{
        while(more && !isCanceled.current && !unmounted.current){
          if(cachedData.current.length > 0){
            const last = cachedData.current[cachedData.current.length - 1];
            cOptions.start = last.time || last.selected_timestamp;
          }
          const url = `${getServiceUrl('log')}/${stateId}?type=state&limit=3600&${querystring.stringify(cOptions)}`;
          const result = await axios.get(url, {
            headers: { "x-session": sessionId || activeSession.meta.id },
            cancelToken: new CancelToken(function executor(cancel) {
              cancelFunc.current = cancel;
            })
          });
          if(result.status !== 200){
            throw new Error("error");
          }
          cachedData.current = cachedData.current.concat(result.data.data);
          more = result.data.more;
        }
        if(unmounted.current){
          return;
        }
        if(!isCanceled.current){
          setData(cachedData.current);
        }
        setCurrentStatus(STATUS.SUCCESS);
      } catch(e){
        if(unmounted.current){
          return;
        }
        if(!isCanceled.current){
          setData(cachedData.current);
        }
        setCurrentStatus(STATUS.ERROR);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      setCurrentStatus(STATUS.CANCELED);
      isCanceled.current = true;
    }
  }, []);

  const reset = useCallback(() => {
    if(cancelFunc.current){
      cancelFunc.current('Operation canceled');
    }
    setData([]);
    setCurrentStatus(STATUS.IDLE);
    isCanceled.current = false;
    cachedData.current = [];
  }, []);

  return { data, status, getLogs, reset, cancel };
}

export default useLogs;
