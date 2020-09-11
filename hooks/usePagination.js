import { useState, useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import useRequest from 'wappsto-blanket/hooks/useRequest';
import { startRequest, STATUS } from 'wappsto-redux/actions/request';
import { getSession } from 'wappsto-redux/selectors/session';

const MAX_PER_PAGE = 15;

const cache = {
  countRequests: {},
  pageRequests: {}
}

export const useGetTotalCount = ({ url }) => {
  const [count, setCount] = useState(0);
  const { request, send } = useRequest();
  
  useEffect(() => {
    send({ method: 'GET', url, reset: false });
  }, [send, url]);

  useEffect(() => {
    if (request?.status === 'success') {
      const totalCount = request.json.count;
      setCount(totalCount);
    }
  }, [request]);

  return count;
}

const getPageCount = ({ store, url, requestsRef }) => {
  const state = store.getState();
  const session = getSession(state);

  let promise;
  if (cache.countRequests[url]) {
    promise = cache.countRequests[url];
  } else {
    promise = startRequest(store.dispatch, url, 'GET', null, {}, session).promise;
    requestsRef.current.push(promise);
    cache.countRequests[url] = promise;
  }

  return promise;
}

const getItems = ({ store, url, query, max_per_page, page, requestsRef }) => {
  const state = store.getState();
  const session = getSession(state);
  const offset = (page - 1) * max_per_page;

  const urlInstance = new URL(`http://${url}`);
  for (const k in query) {
    const v = query[k];
    urlInstance.searchParams.set(k, v);
  }
  urlInstance.searchParams.set('from_last', true);
  urlInstance.searchParams.set('limit', max_per_page);
  urlInstance.searchParams.set('expand', 0);

  const cacheUrl = urlInstance.toString();
  
  urlInstance.searchParams.set('offset', offset);
  const url2 = urlInstance.toString().replace('http:/', '').replace('/?', '?');

  let promise;
  let currentCache;
  if (cache.pageRequests[cacheUrl]?.pages[page]) {
    currentCache = cache.pageRequests[cacheUrl]
    promise = currentCache.pages[page];
  } else {
    promise = startRequest(store.dispatch, url2, 'GET', null, {}, session).promise;
    requestsRef.current.push(promise);
    if (cache.pageRequests[cacheUrl]) {
      currentCache = cache.pageRequests[cacheUrl];
      currentCache.pages[page] = promise;
    } else {
      cache.pageRequests[cacheUrl] = {
        pages: {
          [page]: promise
        }
      }
      currentCache = cache.pageRequests[cacheUrl];
    }
  }

  return { promise, currentCache };
}

export const usePagination = ({ url, query={}, page: pageNo=1, max_per_page=MAX_PER_PAGE }) => {
  const store = useStore();
  const [status, setStatus] = useState();
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(pageNo);
  const [items, setItems] = useState([]);
  const mounted = useRef(true);
  const currentCacheRef = useRef();
  const requestsRef = useRef([]);

  const start = () => {
    mounted.current = true;
    setStatus(STATUS.pending);
    
    const promise1 = getPageCount({ store, url, requestsRef });
    const { promise: promise2, currentCache } = getItems({ store, url, query, max_per_page, page, requestsRef });

    currentCacheRef.current = currentCache;

    Promise.all([promise1, promise2]).then(([resCount, resItems]) => {
      if (page > 1 && !resItems.json.length) {
        setPage(page-1);
        return;
      }
      if (mounted.current) {
        setCount(resCount.json.count);
        setStatus(STATUS.success);
        setItems(resItems.json);
      }
    }).catch((err) => {
      if (mounted.current) {
        console.error(err);
        setStatus(STATUS.error);
      }
    });
  };

  const refresh = () => {
    const url2 = url.split('?')[0];
    delete cache.countRequests[url2];
    currentCacheRef.current.pages = {};
    requestsRef.current = [];
    start();
  }

  useEffect(() => {
    start();
    return () => mounted.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, page, store, max_per_page]);

  return { items, count, page, setPage, refresh, status, requests: requestsRef.current };
}
