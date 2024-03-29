import { useCallback, useRef, useState, useEffect } from 'react';
import { useStore } from 'react-redux';
import qs from 'qs';
import { onLogout, startRequest, getSession } from 'wappsto-redux';
import useMounted from './useMounted';
import { STATUS } from '../util';

const MAX_LOG_LIMIT = 3600;

let cache = {};

onLogout(() => (cache = {}));

export default function useNetworkStatusLog(networkId) {
  const [{ data, status }, setResult] = useState({});
  const functionRef = useRef({});
  const isMounted = useMounted();
  const currentRef = useRef();
  const store = useStore();

  const getFun = ({ start, end, limit, resetCache } = {}) => {
    const getData = async (query, initLimit) => {
      const newQuery = query;
      const tmpData = [];
      let more = true;

      while (more && isMounted.current) {
        const state = store.getState();
        const sessionObj = getSession(state);
        const url = `/log/${networkId}/online_iot?${qs.stringify(newQuery)}`;
        /* eslint-disable-next-line no-await-in-loop */
        const http = await startRequest(store.dispatch, { url, method: 'GET' }, sessionObj);
        if (!isMounted.current) {
          return [];
        }
        if (http.status !== 200) {
          throw http.json;
        }
        tmpData.push(...http.json.data);
        if (tmpData.length < initLimit) {
          more = http.json.more;
          if (more) {
            const last = tmpData.pop();
            newQuery.start = last.time;
          }
        } else {
          more = false;
        }
      }

      return tmpData;
    };

    currentRef.current = {};

    if (!networkId) {
      return;
    }
    if (resetCache) {
      delete cache[networkId];
    }
    if (cache[networkId]) {
      setResult({ status: STATUS.SUCCESS, data: cache[networkId] });
      return;
    }

    let initLimit = limit || MAX_LOG_LIMIT;
    if (initLimit > MAX_LOG_LIMIT) {
      initLimit = MAX_LOG_LIMIT;
    }

    const query = { limit: initLimit, order: 'descending' };
    if (start) {
      if (start.constructor === Date) {
        query.start = start.toISOString();
      } else {
        query.start = start;
      }
    }
    if (end) {
      if (end.constructor === Date) {
        query.end = end.toISOString();
      } else {
        query.end = end;
      }
    }

    const { current } = currentRef;

    setResult({ data: [], status: STATUS.PENDING });

    getData(query, initLimit)
      .then((response) => {
        if (isMounted.current && currentRef.current === current) {
          cache[networkId] = response;
          setResult({ status: STATUS.SUCCESS, data: response });
        }
      })
      .catch(() => {
        if (isMounted.current) {
          setResult({ status: STATUS.ERROR, data: [] });
        }
      });
  };

  useEffect(() => {
    setResult({ status: STATUS.PENDING, data: [] });
  }, [networkId]);

  functionRef.current.get = getFun;
  const get = useCallback((...args) => functionRef.current.get(...args), []);

  return { data, status, get };
}
