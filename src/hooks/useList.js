import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItem, makeEntitiesSelector, makeItemSelector, getUrlInfo } from 'wappsto-redux';
import usePrevious from './usePrevious';
import useRequest from './useRequest';
import { STATUS } from '../util';

const empty = [];

function getQueryAsObj(query) {
  const queryString = {};
  if (query !== '') {
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i += 1) {
      const pair = vars[i].split('=');
      pair[0] = decodeURIComponent(pair[0]);
      pair[1] = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof queryString[pair[0]] === 'undefined') {
        [, queryString[pair[0]]] = pair;
        // If second entry with this name
      } else if (typeof queryString[pair[0]] === 'string') {
        queryString[pair[0]] = [queryString[pair[0]], pair[1]];
        // If third or later entry with this name
      } else {
        queryString[pair[0]].push(pair[1]);
      }
    }
  }
  return queryString;
}

function useList({ url, type, id, childType, query, reset, resetOnEmpty, sort, useCache }) {
  const dispatch = useDispatch();
  const prevQuery = usePrevious(query);
  const newQuery = useRef({});
  const differentQuery = useRef(0);
  if (JSON.stringify(prevQuery) !== JSON.stringify(query)) {
    differentQuery.current += 1;
  }

  const propsData = useMemo(() => {
    let pType = type;
    let pUrl = url;
    let pChildType = childType;
    let pId = id;
    let parent;
    let entitiesType;
    let propsQuery = { ...query };
    if (pUrl) {
      let split = pUrl.split('?');
      [pUrl] = split;
      propsQuery = { ...getQueryAsObj(split.slice(1).join('?')), ...propsQuery };
      split = split[0].split('/');
      const result = getUrlInfo(pUrl);
      if (result.parent) {
        pType = result.parent.type;
        pChildType = result.service;
        entitiesType = pChildType;
      } else {
        pId = result.id;
        pType = result.service;
        entitiesType = pType;
      }
    } else if (pType) {
      pUrl = `/${pType}`;
      if (pId) {
        if (pId.startsWith('?')) {
          propsQuery = { ...propsQuery, ...getQueryAsObj(pId.slice(1)) };
        } else {
          if (!id.startsWith('/')) {
            pUrl += '/';
          }
          pUrl += pId;
        }
      }
      if (pChildType) {
        pUrl += `/${pChildType}`;
        parent = { id, pType };
        entitiesType = pChildType;
      } else {
        entitiesType = pType;
      }
    }
    if (!propsQuery.limit || propsQuery.limit > 100) {
      propsQuery.limit = 100;
    }
    if (!Object.prototype.hasOwnProperty.call(propsQuery, 'offset')) {
      propsQuery.offset = 0;
    }
    return {
      type: pType,
      childType: pChildType,
      entitiesType,
      id: pId,
      url: pUrl,
      query: propsQuery,
      parent,
      resetOnEmpty,
    };
  }, [childType, id, query, resetOnEmpty, type, url]);

  const [customRequest, setCustomRequest] = useState({
    status: propsData.url ? STATUS.PENDING : STATUS.SUCCESS,
    options: { query: propsData.query },
  });

  const name = propsData.url + JSON.stringify(propsData.query);
  const idsItemName = `${name}_ids`;
  const requestIdName = `${name}_requestId`;
  const getSavedIdsItem = useMemo(makeItemSelector, []);
  const savedIds = useSelector((state) => getSavedIdsItem(state, idsItemName)) || empty;

  const { request, send } = useRequest(requestIdName);

  if (propsData.url && !request && customRequest.status !== STATUS.PENDING) {
    setCustomRequest({ status: STATUS.PENDING, options: { query: propsData.query } });
  }

  const { limit } = propsData.query;

  const options = { ids: savedIds, limit: savedIds.length };

  const getEntities = useMemo(makeEntitiesSelector, []);
  let items = useSelector((state) => getEntities(state, propsData.entitiesType, options));

  if (
    !request ||
    items.length === 0 ||
    (request && request.status === STATUS.ERROR) ||
    (propsData.resetOnEmpty &&
      request &&
      request.status === STATUS.PENDING &&
      newQuery.current.offset === propsData.query.offset)
  ) {
    items = empty;
  }
  if (items.length === 1 && items[0].meta.type === 'attributelist') {
    const newItems = [];
    Object.keys(items[0].data).forEach((key) => {
      newItems.push({ id: key, [propsData.id]: items[0].data[key] });
    });
    items = newItems.length > 0 ? newItems : empty;
  }

  const [canLoadMore, setCanLoadMore] = useState(items.length !== 0 && items.length % limit === 0);

  useEffect(() => {
    items.sort(sort);
  }, [items, sort]);

  const prevRequest = usePrevious(request);

  const sendRequest = useCallback(
    (opt) => {
      if (propsData.url) {
        setCanLoadMore(false);
        setCustomRequest({ status: STATUS.PENDING, opt });
        send({
          method: 'GET',
          url: propsData.url,
          ...opt,
        });
      }
    },
    [propsData.url, send],
  );

  const refresh = useCallback(
    (paramReset) => {
      newQuery.current = {
        expand: 0,
        ...propsData.query,
      };
      sendRequest({
        query: newQuery.current,
        reset: typeof paramReset === 'boolean' ? paramReset : reset,
        refresh: true,
      });
    },
    [propsData.query, sendRequest, reset],
  );

  useEffect(() => {
    if (!request || (savedIds === empty && !request)) {
      refresh(reset);
    }
  }, [propsData.query, id, propsData.url, refresh, reset, request, savedIds]);

  // function updateItemCount
  useEffect(() => {
    if (
      prevRequest &&
      prevRequest.status === STATUS.PENDING &&
      request &&
      request.status === STATUS.SUCCESS
    ) {
      dispatch(
        setItem(idsItemName, (pIds) => {
          let ids = pIds;
          if (request.options.refresh) {
            ids = [];
          }
          if (request.json) {
            if (request.json.constructor === Array) {
              ids = [
                ...(ids || []),
                ...request.json.map((item) => (item.constructor === Object ? item.meta.id : item)),
              ];
            } else if (request.json.meta.type === 'attributelist') {
              ids = [propsData.id];
            }
          } else {
            ids = [];
          }
          return ids;
        }),
      );
    }
  }, [dispatch, idsItemName, prevRequest, propsData.id, request]);

  // function updateListLoadMore
  useEffect(() => {
    if (
      prevRequest &&
      prevRequest.status !== STATUS.SUCCESS &&
      request &&
      request.status === STATUS.SUCCESS
    ) {
      let data;
      if (request.json) {
        if (request.json.constructor === Array) {
          data = request.json;
        } else if (request.json.meta.type === 'attributelist') {
          data = Object.keys(request.json.data);
        } else {
          data = [request.json];
        }
        if (data.length === limit) {
          setCanLoadMore(true);
        } else {
          setCanLoadMore(false);
        }
      }
    }
  }, [limit, prevRequest, request]);

  // updateCustomRequest
  useEffect(() => {
    if (request) {
      if (request.status !== STATUS.SUCCESS) {
        setCustomRequest(request);
      } else if (
        (!prevRequest || prevRequest.status === STATUS.SUCCESS) &&
        request.status === STATUS.SUCCESS &&
        (customRequest.status !== STATUS.SUCCESS || customRequest.id !== request.id)
      ) {
        setCustomRequest(request);
      }
    }
  }, [prevRequest, request, customRequest.id, customRequest.status]);

  const loadMore = useCallback(() => {
    if (canLoadMore) {
      newQuery.current = {
        expand: 0,
        ...propsData.query,
        offset: items.length + propsData.query.offset,
      };
      sendRequest({
        query: newQuery.current,
      });
    }
  }, [canLoadMore, propsData.query, items.length, sendRequest]);

  const addItem = useCallback(
    (newId, position = 'start') => {
      const found = savedIds.find((existingId) => existingId === newId);
      if (!found) {
        dispatch(
          setItem(idsItemName, (ids = []) => {
            if (position === 'start') {
              return [newId, ...ids];
            }
            return [...ids, newId];
          }),
        );
        return true;
      }
      return false;
    },
    [dispatch, idsItemName, savedIds],
  );

  const removeItem = useCallback(
    (oldId) => {
      const index = savedIds.findIndex((existingId) => existingId === oldId);
      if (index !== -1) {
        dispatch(
          setItem(idsItemName, (ids = []) => [...ids.slice(0, index), ...ids.slice(index + 1)]),
        );
        return true;
      }
      return false;
    },
    [dispatch, idsItemName, savedIds],
  );

  return {
    items,
    canLoadMore,
    request: customRequest,
    refresh,
    loadMore,
    addItem,
    removeItem,
  };
}

export default useList;
