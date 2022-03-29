import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from 'react-redux';
import { startRequest, STATUS, getSession, onLogout } from 'wappsto-redux';
import useMounted from './useMounted';

const MAX_PER_PAGE_IDS = 1000;
const MAX_PER_PAGE_ITEMS = 10;
const DEFAULT_QUERY = {
  from_last: true,
  verbose: true,
  order_by: 'this_meta.created',
  expand: 0,
};
const cache = { url: {}, item: {} };

onLogout(() => {
  cache.url = {};
  cache.item = {};
});

function fireRequest(url, store, sessionObj, requestsRef, key) {
  const promise = startRequest(store.dispatch, { url, method: 'GET' }, sessionObj);
  requestsRef.current[key] = { promise, status: STATUS.pending };
  return promise;
}

function getSessionObj({ store, session }) {
  const state = store.getState();
  const sessionObj = session ? { meta: { id: session, type: 'session' } } : undefined;
  return sessionObj || getSession(state);
}

function getMaxPerPageIds(no) {
  for (let i = MAX_PER_PAGE_IDS; i >= 0; i -= 1) {
    if (i % no === 0) {
      return i;
    }
  }
  return 0;
}

function getUrl({ url, query = {}, pageSize }) {
  if (!url) {
    return '';
  }
  const [baseUrl, queryStr] = url.split('?');
  const queryInstance = new URLSearchParams(queryStr);
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (Array.isArray(value)) {
      value.sort();
      const str = value.join(',');
      queryInstance.set(key, `[${str}]`);
    } else {
      queryInstance.set(key, value);
    }
  });
  Object.keys(DEFAULT_QUERY).forEach((key) => {
    if (!queryInstance.has(key)) {
      queryInstance.set(key, DEFAULT_QUERY[key]);
    }
  });
  if (!queryInstance.has('limit')) {
    queryInstance.set('limit', getMaxPerPageIds(pageSize));
  }
  Object.keys(query).forEach((key) => {
    if (query[key] === null) {
      queryInstance.delete(key);
    }
  });
  const url2 = `${baseUrl}?${queryInstance.toString()}`;
  return url2;
}

function paginateIds({ ids, url, pageSize, useCache, offset = 0 }) {
  const idsLength = ids.length;
  const pages = {};
  let index = 0;
  while (index < idsLength) {
    const chunk = ids.slice(index, (index += pageSize));
    const page = index / pageSize + offset;
    pages[page] = chunk;
  }
  if (useCache) {
    if (!cache.url[url]) {
      cache.url[url] = {};
    }
    cache.url[url].page = { ...cache.url[url].page, ...pages };
  }
  return pages;
}

const getPages = async ({ url, store, useCache, page, pageSize, requestsRef, sessionObj }) => {
  if (
    (useCache &&
      cache.url[url] &&
      cache.url[url].pageSize === pageSize &&
      cache.url[url].page[page]) ||
    (cache.url[url] && cache.url[url].count === 0)
  ) {
    return { newCount: cache.url[url].count, pages: cache.url[url].page };
  }

  const maxPerPageIds = getMaxPerPageIds(pageSize);
  const paginationIdsPage = Math.ceil((page * pageSize) / maxPerPageIds) - 1;
  const idsOffset = paginationIdsPage * (maxPerPageIds / pageSize);
  const offset = paginationIdsPage * maxPerPageIds;
  const [baseUrl, queryStr] = url.split('?');
  const query = new URLSearchParams(queryStr);
  query.set('offset', offset);
  query.delete('expand');
  const url2 = `${baseUrl}?${query.toString()}`;

  const response = await fireRequest(url2, store, sessionObj, requestsRef, 'count');
  requestsRef.current.count = response;
  if (!response.ok) {
    requestsRef.current.count.status = STATUS.error;
    throw response;
  }
  requestsRef.current.count.status = STATUS.success;

  const pages = paginateIds({
    ids: response.json.id,
    url,
    pageSize,
    useCache,
    offset: idsOffset,
  });

  const { count } = response.json;
  if (useCache) {
    cache.url[url].count = count;
    cache.url[url].pageSize = pageSize;
  }
  return { newCount: count, pages };
};

const getCurrentPageItems = async ({
  url,
  store,
  useCache,
  page,
  requestsRef,
  pages,
  currentItems,
  sessionObj,
}) => {
  let currentItemsObj = {};
  let fetchIds = pages[page] || [];

  if (useCache) {
    currentItemsObj = cache.item;
  } else if (currentItems) {
    currentItems.forEach((e) => (currentItemsObj[e.meta.id] = e));
  }

  if (useCache) {
    if (pages[page]) {
      fetchIds = pages[page].filter((e) => !cache.item[e]);
      if (fetchIds.length === 0) {
        return pages[page].map((e) => cache.item[e]);
      }
    }
  } else if (pages[page] && currentItems.length) {
    fetchIds = pages[page].filter((id) => !currentItemsObj[id]);
  }

  const [baseUrl, query] = url.split('?');
  const query2 = new URLSearchParams(query);

  const urls = [];
  const idsLength = fetchIds.length;
  let index = 0;
  while (index < idsLength) {
    const queryIds = fetchIds.slice(index, 100 + index).join(',');
    query2.set('id', `[${queryIds}]`);
    urls.push(`${baseUrl}?${query2.toString()}`);
    index += 100;
  }

  const promises = urls.map((e) => fireRequest(e, store, sessionObj, requestsRef, 'items'));
  if (urls.length) {
    requestsRef.current.items.promise = promises;
  }
  const newItems = {};
  const response = await Promise.all(promises);
  response.forEach((e) => {
    if (!e.ok) {
      requestsRef.current.items = e;
      requestsRef.current.items.status = STATUS.error;
      throw e;
    }
    e.json.forEach((obj) => (newItems[obj.meta.id] = obj));
  });

  const items = [];
  if (pages[page]) {
    pages[page].forEach((id) => {
      if (newItems[id]) {
        items.push(newItems[id]);
        if (useCache) {
          cache.item[id] = newItems[id];
        }
      } else if (currentItemsObj[id]) {
        items.push(currentItemsObj[id]);
      }
    });
  }
  requestsRef.current.items = { ok: true, status: STATUS.success, json: items };
  return items;
};

export default function usePagination(paginationInit) {
  const [pagination, setPagination] = useState(paginationInit);
  const {
    url,
    query,
    page: pageNo = 1,
    pageSize = MAX_PER_PAGE_ITEMS,
    useCache = true,
    session,
  } = pagination || {};
  const [[items, pageLength], setItems] = useState([[], pageSize]);
  const [page, setPage] = useState(pageNo);
  const [status, setStatus] = useState('idle');
  const [count, setCount] = useState(0);
  const [itemIds, setItemIds] = useState([]);
  const isMountedRef = useMounted();
  const requestsRef = useRef({ count: undefined, items: undefined });
  const functionRef = useRef({});
  const store = useStore();

  const get = useCallback(
    (newState) => {
      if (isMountedRef.current) {
        setPagination((current) => ({ ...(current || {}), ...(newState || {}) }));
      }
    },
    [isMountedRef],
  );

  const setCurrentPage = useCallback((newPageNo) => get({ page: newPageNo }), [get]);

  useEffect(() => {
    const startPagination = async () => {
      if (!url) {
        return;
      }
      setStatus(STATUS.pending);
      const pageNumber = parseInt(pageNo, 10) || 1;
      const sessionObj = getSessionObj({ store, session });
      const urlFull = getUrl({ url, query, pageSize });
      const { newCount, pages } = await getPages({
        url: urlFull,
        store,
        useCache,
        page: pageNumber,
        requestsRef,
        pageSize,
        sessionObj,
      });
      const lastPage = Math.ceil(newCount / pageSize);
      if (pageNumber > lastPage && lastPage > 0) {
        setCurrentPage(lastPage);
        return;
      }
      const newItems = await getCurrentPageItems({
        url: urlFull,
        store,
        useCache,
        page: pageNumber,
        requestsRef,
        pages,
        currentItems: items,
        sessionObj,
      });
      if (isMountedRef.current) {
        setPage(pageNumber);
        setCount(newCount);
        setItems([newItems, pageSize]);
        setItemIds(pages[pageNumber] || []);
        setStatus(STATUS.success);
      }
    };
    startPagination().catch(() => {
      if (isMountedRef.current) {
        setItems((current) => (current.length ? [] : current));
        setItemIds((current) => (current.length ? [] : current));
        setStatus(STATUS.error);
      }
    });
  }, [
    pagination,
    isMountedRef,
    pageNo,
    pageSize,
    query,
    store,
    session,
    url,
    setCurrentPage,
    useCache,
    // items,
  ]);

  const refresh = () => {
    const urlFull = getUrl({ url, query, pageSize });
    if (cache.url[urlFull]) {
      Object.keys(cache.url[urlFull].page).forEach((key) => {
        cache.url[urlFull].page[key].forEach((id) => delete cache.item[id]);
      });
      delete cache.url[urlFull];
    }
    get();
  };

  const add = (item) => {
    if (!url) {
      return;
    }
    const idUrl = getUrl({ url, query, pageSize });
    if (!useCache) {
      if (!items) {
        return;
      }
      if (page === 1) {
        const newItems = [item, ...items];
        if (newItems.length > pageLength) {
          newItems.pop();
        }
        setCount((current) => current + 1);
        setItemIds(newItems.map((e) => e.meta.id));
        setItems([newItems, pageLength]);
      } else {
        refresh();
      }
    } else if (cache.url[idUrl]) {
      const { id } = item.meta;
      cache.url[idUrl].count += 1;
      cache.item[id] = item;
      const lastPage = Math.ceil(cache.url[idUrl].count / pageSize);
      const lastPageOld = Math.ceil((cache.url[idUrl].count - 1) / pageSize);
      if (lastPage > lastPageOld && !cache.url[idUrl].page[lastPage]) {
        cache.url[idUrl].page[lastPage] = [];
      }
      if (idUrl.includes('from_last=true')) {
        let prevPage = 0;
        let prevId = id;
        Object.keys(cache.url[idUrl].page).forEach((key) => {
          const newPage = parseInt(key, 10);
          const ids = cache.url[idUrl].page[newPage];
          if (prevPage === newPage - 1) {
            ids.unshift(prevId);
          } else {
            prevPage = newPage;
            prevId = ids.pop();
            delete cache.url[idUrl].page[newPage];
          }
          if (ids.length > cache.url[idUrl].pageSize) {
            prevPage = newPage;
            prevId = ids.pop();
          }
        });
        get();
      } else if (cache.url[idUrl].page[lastPage]) {
        cache.url[idUrl].page[lastPage].push(id);
        get();
      }
    }
  };

  const remove = (pId) => {
    const idUrl = getUrl({ url, query, pageSize });
    let id = pId;
    if (id && id.constructor === Object) {
      id = id.meta.id;
    }
    if (!useCache) {
      if (!items) {
        return;
      }
      const found = items.findIndex((e) => e.meta.id === id);
      if (found !== -1) {
        const newItems = [...items];
        newItems.splice(found, 1);
        setItems([newItems, pageLength]);
        const lastPage = Math.ceil(count / pageSize);
        if (lastPage !== page || !newItems.length) {
          refresh();
        } else {
          setCount((current) => current - 1);
          setItemIds(newItems.map((e) => e.meta.id));
        }
      }
    } else if (cache.url[idUrl]) {
      const arrCachePage = Object.entries(cache.url[idUrl].page);
      const [deletePageNo, pageIds] = arrCachePage.find(([, v]) => v.includes(id)) || [];
      if (!pageIds) {
        return;
      }
      const index = pageIds.indexOf(id);
      pageIds.splice(index, 1);
      delete cache.item[id];
      cache.url[idUrl].count -= 1;
      const lastPage = Math.ceil(cache.url[idUrl].count / pageSize);
      arrCachePage.forEach(([key, ids], i) => {
        const newPage = parseInt(key, 10);
        if (newPage < parseInt(deletePageNo, 10)) {
          return;
        }
        const [nextPageNo, nextPageIds] = arrCachePage[i + 1] || [];
        if (!cache.url[idUrl].page[newPage - 1] && newPage !== parseInt(deletePageNo, 10)) {
          ids.shift();
        }
        if (newPage + 1 === parseInt(nextPageNo, 10)) {
          const shiftedId = nextPageIds.shift();
          ids.push(shiftedId);
        } else if (newPage !== lastPage) {
          delete cache.url[idUrl].page[newPage];
        }
      });
      if (page > lastPage) {
        setCurrentPage(lastPage || 1);
      } else {
        get();
      }
    }
  };

  const update = (item) => {
    const { id } = item.meta;
    if (cache.item[id]) {
      cache.item[id] = item;
      const idUrl = getUrl({ url, query, pageSize });
      const pageItems = cache.url[idUrl].page[page];
      const found = pageItems.includes(id);
      if (found) {
        get();
      }
    }
  };

  functionRef.current.update = update;
  functionRef.current.remove = remove;
  functionRef.current.add = add;
  functionRef.current.refresh = refresh;
  const updateItem = useCallback((...args) => functionRef.current.update(...args), []);
  const removeItem = useCallback((...args) => functionRef.current.remove(...args), []);
  const addItem = useCallback((...args) => functionRef.current.add(...args), []);
  const refreshAll = useCallback((...args) => functionRef.current.refresh(...args), []);

  return {
    items,
    count,
    page,
    pageSize: pageLength,
    setPage: setCurrentPage,
    refresh: refreshAll,
    status,
    get,
    addItem,
    removeItem,
    updateItem,
    requests: requestsRef.current,
    itemIds,
  };
}
