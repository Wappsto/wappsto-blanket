import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from 'react-redux';
import { startRequest, STATUS } from 'wappsto-redux/actions/request';
import { getSession } from 'wappsto-redux/selectors/session';
import { onLogout } from 'wappsto-redux/events';

const MAX_PER_PAGE_IDS = 1000;
const MAX_PER_PAGE_ITEMS = 10;
const cache = { url: {}, item: {} };

onLogout(() => {
  cache.url = {};
  cache.item = {};
});

const fireRequest = (url, store, sessionObj, requestsRef, key) => {
  const promise = startRequest(store.dispatch, { url, method: 'GET' }, sessionObj);
  requestsRef.current[key] = { promise, status: STATUS.pending };
  return promise;
}

const getSessionObj = ({ store, session }) => {
  const state = store.getState();
  const sessionObj = session ? { meta: { id: session, type: 'session' } } : undefined;
  return sessionObj || getSession(state);
}

const getUrl = ({ url, query={} }) => {
  const [baseUrl, queryStr] = url?.split('?') || [];
  const queryInstance = new URLSearchParams(queryStr);
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.sort();
      const str = value.join(',');
      queryInstance.append(key, `[${str}]`);
    } else {
      queryInstance.append(key, value);
    }
  }
  if (!queryInstance.has('from_last')) queryInstance.set('from_last', true);
  queryInstance.set('limit', MAX_PER_PAGE_IDS);
  queryInstance.delete('expand');
  Object.entries(query).forEach(([k, v]) => v === null && queryInstance.delete(k));
  const url2 = `${baseUrl}?${queryInstance.toString()}`;
  return url2;
}

const paginateIds = ({ ids, url, pageSize, useCache, offset=0 }) => {
  const idsLength = ids.length;
  const pages = { 1: [] };
  let index = 0;
  while (index < idsLength) {
    const chunk = ids.slice(index, index += pageSize);
    const page = (index / pageSize) + offset;
    pages[page] = chunk;
  }
  if (useCache) {
    cache.url[url] ||= {};
    cache.url[url].page = { ...cache.url[url].page, ...pages };
  }
  return pages;
}

const getPages = async ({ url, store, useCache, page, pageSize, requestsRef, sessionObj }) => {
  if ((useCache && cache.url[url]?.pageSize === pageSize && cache.url[url].page[page]) || cache.url[url]?.count === 0) {
    return { count: cache.url[url].count, pages: cache.url[url].page };
  }
  
  const paginationIdsPage = Math.ceil((page * pageSize) / MAX_PER_PAGE_IDS) - 1;
  const idsOffset = paginationIdsPage * (MAX_PER_PAGE_IDS / pageSize);
  const offset = paginationIdsPage * MAX_PER_PAGE_IDS;
  const [baseUrl, queryStr] = url.split('?');
  const query = new URLSearchParams(queryStr);
  query.set('offset', offset);
  const url2 = `${baseUrl}?${query.toString()}`;

  const response = await fireRequest(url2, store, sessionObj, requestsRef, 'count');
  requestsRef.current.count = response;
  if (!response.ok) {
    requestsRef.current.count.status = STATUS.error;
    throw response;
  }
  requestsRef.current.count.status = STATUS.success;

  const pages = paginateIds({ ids: response.json.id, url, pageSize, useCache, offset: idsOffset });

  const count = response.json.count;
  if (useCache) {
    cache.url[url].count = count;
    cache.url[url].pageSize = pageSize;
  }

  return { count, pages };
}

const getCurrentPageItems = async ({ url, store, useCache, page, requestsRef, pages, pageSize, sessionObj }) => {
  if (useCache) {
    const ids = pages[page]?.filter((e) => !cache.item[e]);
    if (ids?.length === 0) {
      const items = pages[page].map((e) => cache.item[e]);
      return items;
    }
  }

  const [baseUrl, query] = url.split('?');
  const query1 = new URLSearchParams(query);
  const query2 = new URLSearchParams();
  query2.set('expand', 0);
  if (query1.has('verbose')) query2.set('verbose', query1.get('verbose'));

  const urls = [];
  const idsLength = pages[page]?.length || 0;
  let index = 0;
  while (index < idsLength) {
    const queryIds = pages[page].slice(index, 100 + index).join(',');
    query2.set('id', `[${queryIds}]`);
    const url = `${baseUrl}?${query2.toString()}`;
    urls.push(url);
    index += 100;
  }

  const promises = urls.map((e) => fireRequest(e, store, sessionObj, requestsRef, 'items'));
  if (urls.length) requestsRef.current.items.promise = promises;
  const response = await Promise.all(promises);

  const items = response.reduce((arr, e) => {
    if (!e.ok) {
      requestsRef.current.items = e;
      requestsRef.current.items.status = STATUS.error;
      throw e;
    }
    return [...arr, ...e.json];
  }, []);
  requestsRef.current.items = { ok: true, status: STATUS.success, json: items };

  if (useCache) {
    items.forEach((e) => {
      const id = e.meta.id;
      cache.item[id] = e;
    });
  }
  return items;
}

const usePagination = (paginationInit) => {
  const [pagination, setPagination] = useState(paginationInit);
  const { url, query, page: pageNo=1, pageSize=MAX_PER_PAGE_ITEMS, useCache=true, session, resetCache=false } = pagination || {};
  const [[items, pageLength], setItems] = useState([[], pageSize]);
  const [page, setPage] = useState(pageNo);
  const [status, setStatus] = useState();
  const [count, setCount] = useState(0);
  const requestsRef = useRef({ count: undefined, items: undefined });
  const functionRef = useRef({});
  const store = useStore();

  useEffect(() => {
    let isMounted = true;

    const startPagination = async () => {
      if (!url) return;
      setStatus(STATUS.pending);
      const sessionObj = getSessionObj({ store, session });
      const urlFull = getUrl({ url, query });
      if (resetCache && cache.url[urlFull]) {
        const ids = Object.values(cache.url[urlFull].page).flat();
        ids.forEach((e) => delete cache.item[e]);
        delete cache.url[urlFull];
      }
      const { count, pages } = await getPages({ url: urlFull, store, useCache, page: pageNo, requestsRef, pageSize, sessionObj });
      const items = await getCurrentPageItems({ url: urlFull, store, useCache, page: pageNo, requestsRef, pages, pageSize, sessionObj });
      if (isMounted) {
        setPage(pageNo);
        setCount(count);
        setItems([items, pageSize]);
        setStatus(STATUS.success);
      }
    }
    startPagination().catch((error) => {
      console.error(error);
      if (isMounted) {
        setStatus(STATUS.error);
        setItems((current) => current.length ? [] : current);
      }
    });

    return () => {
      isMounted = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination]);

  const refresh = useCallback(() => {
    setPagination((current) => {
      if (current?.constructor !== Object) return current;
      return { ...current, resetCache: true };
    });
  }, []);

  const setCurrentPage = useCallback((pageNo) => {
    setPagination((current) => {
      if (current?.constructor !== Object) return current;
      return { ...current, page: pageNo, resetCache: false };
    });
  }, []);

  const add = (item) => {
    const idUrl = getUrl({ url, query });
    if (!useCache) {
      setItems(([items, pageLength]) => {
        let newItems = [item, ...items];
        newItems.pop();
        return [newItems, pageLength];
      });
    } else if (cache.url[idUrl]) {
      const id = item.meta.id;
      cache.url[idUrl].count++;
      cache.item[id] = item;
      const lastPage = Math.ceil(cache.url[idUrl].count / pageSize);
      const lastPageOld = Math.ceil((cache.url[idUrl].count - 1) / pageSize);
      if (lastPage > lastPageOld) cache.url[idUrl].page[lastPage] ||= [];
      if (idUrl.includes('from_last=true')) {
        let prevTemp;
        Object.entries(cache.url[idUrl].page).forEach(([page, ids], i, arr) => {
          if (page == 1) {
            ids.unshift(id);
            if (arr.length === 1 && ids > cache.url[idUrl].pageSize) {
              ids.pop();
            }
            return;
          }
          const prevPage = cache.url[idUrl].page[+page - 1] || prevTemp?.[+page - 1];
          if (prevPage) {
            const shiftedId = prevPage.pop();
            ids.unshift(shiftedId);
            if (!cache.url[idUrl].page[+page + 1] && page != lastPage) ids.pop();
          } else {
            prevTemp = { [+page]: ids };
            delete cache.url[idUrl].page[+page];
          }
        });
        setPagination((current) => ({ ...current, resetCache: false }));
      } else if (cache.url[idUrl].page[lastPage]) {
        cache.url[idUrl].page[lastPage].push(id);
        setPagination((current) => ({ ...current, resetCache: false }));
      }
    }
  };
  
  const remove = ((id) => {
    const idUrl = getUrl({ url, query });
    if (id?.constructor === Object) id = id.meta.id;
    if (!useCache) {
      const found = items.find((e) => e.meta.id === id);
      found && refresh();
    } else if (cache.url[idUrl]) {
      const arrCachePage = Object.entries(cache.url[idUrl].page);
      const [deletePageNo, pageIds] = arrCachePage.find(([, v]) => v.includes(id)) || [];
      if (!pageIds) return;
      let index = pageIds.indexOf(id);
      pageIds.splice(index, 1);
      delete cache.item[id];
      cache.url[idUrl].count--;
      const lastPage = Math.ceil(cache.url[idUrl].count / pageSize);
      arrCachePage.forEach(([page, ids], i) => {
        if (+page < deletePageNo) return;
        const [nextPageNo, nextPageIds] = arrCachePage[i+1] || [];
        if (!cache.url[idUrl].page[(+page - 1)] && page !== deletePageNo) {
          ids.shift();
        }
        if ((+page + 1) == nextPageNo) {
          const shiftedId = nextPageIds.shift();
          ids.push(shiftedId);
        } else if (page != lastPage) {
          delete cache.url[idUrl].page[+page];
        }
      });
      if (pageNo > lastPage) {
        setCurrentPage(lastPage || 1);
      } else {
        setPagination((current) => ({ ...current, resetCache: false }));
      }
    }
  });

  const update = ((item) => {
    const id = item.meta.id;
    if (cache.item[id]) {
      cache.item[id] = item;
      const idUrl = getUrl({ url, query });
      const pageItems = cache.url[idUrl].page[page];
      const found = pageItems.includes(id);
      found && setPagination((current) => ({ ...current, resetCache: false }));
    }
  });
  
  functionRef.current.update = update;
  functionRef.current.remove = remove;
  functionRef.current.add = add;
  const updateItem = useCallback((...args) => functionRef.current.update(...args), []);
  const removeItem = useCallback((...args) => functionRef.current.remove(...args), []);
  const addItem = useCallback((...args) => functionRef.current.add(...args), []);

  return {
    items, count, page, pageSize: pageLength, setPage: setCurrentPage, refresh, status, get: setPagination,
    addItem, removeItem, updateItem, requests: requestsRef.current
  };
}

export default usePagination;
