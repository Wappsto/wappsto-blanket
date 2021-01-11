import { useState, useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import useRequest from './useRequest';
import { startRequest, STATUS } from 'wappsto-redux/actions/request';
import { getSession } from 'wappsto-redux/selectors/session';
import * as globalCache from 'wappsto-redux/globalCache';

const MAX_PER_PAGE = 10;

const cacheKey = 'usePagination';
globalCache.initialize(cacheKey, {
  countRequests: {},
  pageRequests: {}
});

const computeUrl = (url, query, pageSize) => {
  const urlInstance = new URL(`https://${url}`);
  urlInstance.searchParams.set('from_last', true);
  urlInstance.searchParams.set('expand', 0);
  for (const k in query) {
    const v = query[k];
    if(v !== null){
      urlInstance.searchParams.set(k, v);
    } else{
      urlInstance.searchParams.delete(k);
    }
  }
  urlInstance.searchParams.set('limit', pageSize);
  return urlInstance;
}

export const useGetTotalCount = ({ url }) => {
  const [count, setCount] = useState(0);
  const { request, send } = useRequest();

  useEffect(() => {
    send({ method: 'GET', url, reset: false });
  }, [send, url]);

  useEffect(() => {
    if (request?.status === STATUS.success) {
      const totalCount = request.json.count;
      setCount(totalCount);
    }
  }, [request]);

  return count;
}

const fireRequest = (state, url, store, session, requestsRef, key) => {
  const promise = startRequest(store.dispatch, { url, method: 'GET' }, session);
  requestsRef.current[key] = { promise, status: STATUS.pending };
  return promise;
}

const getPageCount = ({ store, url, requestsRef, resetCache, useCache }) => {
  const state = store.getState();
  const session = getSession(state);
  const cache = globalCache.get(cacheKey);

  if(resetCache){
    delete cache.countRequests[url];
  }

  let promise;
  if (useCache && cache.countRequests[url]) {
    promise = cache.countRequests[url];
  } else {
    promise = fireRequest(state, url, store, session, requestsRef, 'count');
  }

  return promise;
}

const getItems = ({ store, url, query, pageSize, page, requestsRef, resetCache, useCache }) => {
  const cache = globalCache.get(cacheKey);
  const state = store.getState();
  const session = getSession(state);
  const offset = (page - 1) * pageSize;

  const urlInstance = computeUrl(url, query, pageSize);
  const cacheUrl = urlInstance.toString();

  urlInstance.searchParams.set('offset', offset);
  const url2 = urlInstance.toString().replace('https:/', '').replace('/?', '?');

  if(resetCache && cache.pageRequests[cacheUrl]){
    cache.pageRequests[cacheUrl].pages = {};
  }

  let promise;
  const pageItems = useCache && cache.pageRequests[cacheUrl]?.pages?.[page];
  if(pageItems && !pageItems?.invalid){
    promise = cache.pageRequests[cacheUrl].pages?.[page];
  } else {
    promise = fireRequest(state, url2, store, session, requestsRef, 'items');
  }

  return { promise, cacheUrl };
}

const usePagination = ({ url, query, page: pageNo=1, pageSize=MAX_PER_PAGE, useCache=true }) => {
  const store = useStore();
  const [status, setStatus] = useState();
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(pageNo);
  const [items, setItems] = useState([]);
  const mounted = useRef(true);
  const skipPageChange = useRef(false);
  const requestsRef = useRef({ items: null, count: null });

  const start = (currentPage=page, resetCache) => {
    requestsRef.current = { items: { status: STATUS.pending }, count: { status: STATUS.pending } };
    mounted.current = true;
    setStatus(STATUS.pending);

    const promise1 = getPageCount({ store, url, requestsRef, resetCache, useCache });
    const { promise: promise2, cacheUrl } = getItems({ store, url, query, pageSize, page: currentPage, requestsRef, resetCache, useCache });

    Promise.all([promise1, promise2]).then(([resCount, resItems]) => {
      if(!mounted.current) {
        return;
      }
      let error;
      if(resCount.hasOwnProperty('ok')){
        requestsRef.current.count = resCount;
        requestsRef.current.count.status = STATUS.success;
        if(!resCount.ok){
          requestsRef.current.count.status = STATUS.error;
          error = true;
        }
      } else {
        requestsRef.current.count = {status: STATUS.success, json: resCount};
      }
      if(resItems.hasOwnProperty('ok')){
        requestsRef.current.items = resItems;
        requestsRef.current.items.status = STATUS.success;
        if(!resItems.ok){
          requestsRef.current.items.status = STATUS.error;
          error = true;
        }
      } else {
        requestsRef.current.items = {status: STATUS.success, json: resItems};
      }
      if(error){
        setStatus(STATUS.error);
        return
      }
      const countRes = requestsRef.current.count.json;
      const itemsRes = requestsRef.current.items.json;
      const cache = globalCache.get(cacheKey);
      cache.countRequests[url] = countRes;
      if(!cache.pageRequests[cacheUrl]){
        cache.pageRequests[cacheUrl] = { pages: {} };
      }
      cache.pageRequests[cacheUrl].pages[currentPage] = itemsRes;
      if (currentPage > 1 && !itemsRes.length) {
        setPage(1);
        return;
      }
      if (mounted.current) {
        if(currentPage !== page){
          skipPageChange.current = true;
          setPage(currentPage);
        }
        setCount(countRes.count);
        setStatus(STATUS.success);
        setItems(itemsRes);
      }
    }).catch(() => {
      if (mounted.current) {
        requestsRef.current.count = { status: STATUS.error };
        requestsRef.current.items = { status: STATUS.error };
        setStatus(STATUS.error);
      }
    });
  };

  const refresh = () => {
    start(null, true);
  }

  const addItem = (item, addInPage=1) => {
    const urlInstance = computeUrl(url, query, pageSize);
    const cacheUrl = urlInstance.toString();
    const cache = globalCache.get(cacheKey);
    if(!cache.pageRequests[cacheUrl]){
      cache.pageRequests[cacheUrl].pages = { [addInPage]: [] };
    }
    const pagesCache = cache.pageRequests[cacheUrl].pages;
    if(!pagesCache[addInPage].find(i => i?.meta?.id === item?.meta?.id)){
      if(!cache.countRequests[url]){
        cache.countRequests[url] = { count: 1 };
      } else {
        cache.countRequests[url].count++;
      }
      pagesCache[addInPage] = [{...item}, ...pagesCache[addInPage]];
      //shifting
      let currentPage = addInPage;
      while(pagesCache[currentPage]){
        if(pagesCache[currentPage].length > pageSize){
          const last = pagesCache[currentPage].pop();
          if(pagesCache[currentPage + 1]){
            pagesCache[currentPage + 1].unshift(last);
          }
        }
        currentPage++;
      }
      if(currentPage * pageSize < cache.countRequests[url].count){
        Object.keys(pagesCache).forEach(pageNumber => {
          if(pageNumber > currentPage){
            pagesCache[pageNumber].invalid = true
          }
        });
      }
      setCount(cache.countRequests[url].count);
      const pageItems = cache.pageRequests[cacheUrl].pages[page];
      if(pageItems && !pageItems?.invalid){
        setItems(cache.pageRequests[cacheUrl].pages[page] || []);
      } else {
        setItems([]);
        start();
      }
    }
  }

  const removeItem = (item, deleteInPage=page) => {
    const cache = globalCache.get(cacheKey);
    const shiftRemove = (page, index, pagesCache) => {
      //shifting
      pagesCache[page] = [...pagesCache[page].slice(0, index), ...pagesCache[page].slice(index + 1)];
      let currentPage = page;

      while(pagesCache[currentPage] && pagesCache[currentPage].length === pageSize - 1 && pagesCache[currentPage + 1] && pagesCache[currentPage + 1].length){
        pagesCache[currentPage].push(pagesCache[currentPage + 1].shift());
        currentPage++;
      }

      if(currentPage * pageSize < cache.countRequests[url].count){
        Object.keys(pagesCache).forEach(pageNumber => {
          if(pageNumber >= currentPage){
            pagesCache[pageNumber].invalid = true;
          }
        });
      }
    }

    const urlInstance = computeUrl(url, query, pageSize);
    const cacheUrl = urlInstance.toString();
    const pagesCache = cache.pageRequests[cacheUrl]?.pages;
    if(pagesCache){
      if(deleteInPage){
        if(pagesCache[deleteInPage]){
          const index = pagesCache[deleteInPage].findIndex(i => i?.meta?.id === item?.meta?.id);
          if(index !== -1){
            shiftRemove(page, index, pagesCache);
          }
        }
      } else {
        const pageNumbers = Object.keys(pagesCache);
        for(let i = 0; i < pageNumbers.length; i++){
          const index = pagesCache[pageNumbers[i]].findIndex(it => it?.meta?.id === item?.meta?.id);
          if(index !== -1){
            shiftRemove(i, index, pagesCache);
            deleteInPage = i;
            break;
          }
        }
      }
      cache.countRequests[url].count--;
      setCount(cache.countRequests[url].count);
      const pageItems = cache.pageRequests[cacheUrl].pages[page];
      if(pageItems && !pageItems?.invalid){
        setItems(cache.pageRequests[cacheUrl].pages[page] || []);
      } else {
        setItems([]);
        start();
      }
    }
  }

  useEffect(() => {
    if(skipPageChange.current){
      skipPageChange.current = false;
      return;
    }
    start();
    return () => mounted.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, store, pageSize]);

  useEffect(() => {
    start(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, query]);

  return { items, count, page, setPage, refresh, status, requests: requestsRef.current, addItem, removeItem };
}

export default usePagination;
