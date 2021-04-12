import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import querystring from 'query-string';
import { onLogout } from 'wappsto-redux/events';
import { startRequest, STATUS } from 'wappsto-redux/actions/request';
import { getSession } from 'wappsto-redux/selectors/session';

const MAX_LOG_LIMIT = 3600;

let cache = {};

onLogout(() => cache = {});

const getData = async ({ networkId, query, isMountedRef, initLimit, store }) => {
  let data = [];
  let more = true;

  while(more && isMountedRef.current) {
    const state = store.getState();
    const sessionObj = getSession(state);
    const url = `/log/${networkId}/online_iot?${querystring.stringify(query)}`;
    const http = await startRequest(store.dispatch, { url, method: 'GET' }, sessionObj);
    if(!isMountedRef.current) {
      return;
    }
    if(http.status !== 200) {
      throw http.json;
    }
    data.push(...http.json.data);
    if (data.length < initLimit) {
      more = http.json.more;
      if(more) {
        const last = data.pop();
        query.start = last.time;
      }
    } else {
      more = false;
    }
  }

  return data.reverse();
}

const useNetworkStatusLog = (initNetworkId) => {
  const [{ data, status }, setResult] = useState({});
  const functionRef = useRef({});
  const isMountedRef = useRef(true);
  const currentRef = useRef();
  const store = useStore();

  useEffect(() => {
    return () => isMountedRef.current = false;
  }, []);

  const _get = ({ start, end, networkId=initNetworkId, limit: initLimit, resetCache }) => {
    currentRef.current = {};
    if(!networkId) {
      return;
    }
    if (resetCache) {
      delete cache[networkId];
    }
    if (cache[networkId]) {
      setResult({ status: STATUS.success, data: cache[networkId] });
      return;
    }
    if(start && start.constructor === Date) {
      start = start.toISOString();
    }
    if(end && end.constructor === Date) {
      end = end.toISOString();
    }

    let limit = initLimit || MAX_LOG_LIMIT;
    if (limit > MAX_LOG_LIMIT) {
      limit = MAX_LOG_LIMIT
    }

    const current = currentRef.current;
    const query = { limit, order: 'descending' };
    if (start && end) {
      query.start = start;
      query.end = end;
    }

    setResult({ status: STATUS.pending, data });

    getData({ networkId, query, isMountedRef, initLimit, store }).then((data) => {
      if(isMountedRef.current && currentRef.current === current) {
        cache[networkId] = data;
        setResult({ status: STATUS.success, data });
      } 
    }).catch(() => {
      if(isMountedRef.current) {
        setResult({ status: STATUS.error, data: [] });
      }
    });
  }

  functionRef.current.get = _get;
  const get = useCallback((...args) => functionRef.current.get(...args), []);

  return { data, status, get };
};

export default useNetworkStatusLog;
