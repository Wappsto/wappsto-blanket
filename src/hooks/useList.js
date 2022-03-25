import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItem, makeEntitiesSelector, makeItemSelector, getUrlInfo } from 'wappsto-redux';
import usePrevious from './usePrevious';
import useRequest from './useRequest';
import { STATUS } from '../util';

const empty = [];

function getQueryObj(query) {
  const urlParams = {};
  let match;
  const pl = /\+/g;
  const search = /([^&=]+)=?([^&]*)/g;
  function decode(s) {
    return decodeURIComponent(s.replace(pl, ' '));
  };

  while(match) {
    match = search.exec(query);
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}

/*
props: url, type, id, childType, query, reset, resetOnEmpty, sort
*/
export default function useList(inputProps) {
  const props = inputProps || {};
  const dispatch = useDispatch();
  const prevQuery = usePrevious(props.query);
  const query = useRef({});
  const differentQuery = useRef(0);
  if (JSON.stringify(prevQuery) !== JSON.stringify(props.query)) {
    differentQuery.current += 1;
  }

  const propsData = useMemo(() => {
    let { type, id, childType, url } = props;
    let parent;
    let entitiesType;
    let propsQuery = { ...props.query };
    if (url) {
      let split = url.split('?');
      [ url ] = split;
      propsQuery = { ...getQueryObj(split.slice(1).join('?')), ...propsQuery };
      split = split[0].split('/');
      const result = getUrlInfo(url);
      if (result.parent) {
        type = result.parent.type;
        childType = result.service;
        entitiesType = childType;
      } else {
        id = result.id;
        type = result.service;
        entitiesType = type;
      }
    } else if (type) {
      url = `/${type}`;
      if (id) {
        if (id.startsWith('?')) {
          propsQuery = { ...propsQuery, ...getQueryObj(id.slice(1)) };
        } else {
          if (!id.startsWith('/')) {
            url += '/';
          }
          url += id;
        }
      }
      if (childType) {
        url += `/${childType}`;
        parent = { id, type };
        entitiesType = childType;
      } else {
        entitiesType = type;
      }
    }
    if (!propsQuery.limit || propsQuery.limit > 100) {
      propsQuery.limit = 100;
    }
    if (!Object.prototype.hasOwnProperty.call(propsQuery, 'offset')) {
      propsQuery.offset = 0;
    }
    return {
      type,
      childType,
      entitiesType,
      id,
      url,
      query: propsQuery,
      parent
    };
  }, [props.type, props.id, props.childType, props.url, differentQuery.current]);

  const [customRequest, setCustomRequest] = useState({
    status: propsData.url ? STATUS.PENDING : STATUS.SUCCESS,
    options: { query: props.query }
  });
  // const name = props.name || propsData.url + JSON.stringify(propsData.query);
  const name = propsData.url + JSON.stringify(propsData.query);
  const idsItemName = `${name  }_ids`;
  const requestIdName = `${name  }_requestId`;
  const getSavedIdsItem = useMemo(makeItemSelector, []);
  const savedIds = useSelector((state) => getSavedIdsItem(state, idsItemName)) || empty;
  const { request, send } = useRequest(requestIdName);

  if (propsData.url && !request && customRequest.status !== STATUS.PENDING) {
    setCustomRequest({ status: STATUS.PENDING, options: { query: props.query } });
  }

  const {limit} = propsData.query;

  const options = { ids: savedIds, limit: savedIds.length };

  const getEntities = useMemo(makeEntitiesSelector, []);
  let items = useSelector((state) => getEntities(state, propsData.entitiesType, options));

  if (
    !request ||
    items.length === 0 ||
    (request && request.status === STATUS.ERROR) ||
    (props.resetOnEmpty &&
      request &&
      request.status === STATUS.PENDING &&
      query.current.offset === propsData.query.offset)
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
    items.sort(props.sort);
  }, [items, props.sort]);

  const prevRequest = usePrevious(request);

  const sendRequest = useCallback(
    (opt) => {
      if (propsData.url) {
        setCanLoadMore(false);
        setCustomRequest({ status: STATUS.PENDING, opt });
        send({
          method: 'GET',
          url: propsData.url,
          ...opt
        });
      }
    },
    [propsData.url, send]
  );

  const refresh = useCallback(
    (reset) => {
      query.current = {
        expand: 0,
        ...propsData.query
      };
      sendRequest({
        query: query.current,
        reset: typeof reset === 'boolean' ? reset : props.reset,
        refresh: true
      });
    },
    [propsData.query, sendRequest, props.reset]
  );

  useEffect(() => {
    if (
      props.useCache === false ||
      !request ||
      (savedIds === empty && !request) ||
      (request && request.status === STATUS.ERROR)
    ) {
      refresh(props.reset);
    }
  }, [propsData.query, props.id, propsData.url, refresh, props.useCache]);

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
                ...request.json.map((item) => (item.constructor === Object ? item.meta.id : item))
              ];
            } else if (request.json.meta.type === 'attributelist') {
              ids = [propsData.id];
            }
          } else {
            ids = [];
          }
          return ids;
        })
      );
    }
  }, [dispatch, idsItemName, prevRequest, propsData.id, request]);

  // function updateListLoadMore
  useEffect(() => {
    if (
      request &&
      prevRequest &&
      prevRequest.status !== STATUS.SUCCESS &&
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
  }, [prevRequest, request]);

  const loadMore = useCallback(() => {
    if (canLoadMore) {
      query.current = {
        expand: 0,
        ...propsData.query,
        offset: items.length + propsData.query.offset
      };
      sendRequest({
        query: query.current
      });
    }
  }, [canLoadMore, propsData.query, items.length, sendRequest]);

  const addItem = useCallback(
    (id, position = 'start') => {
      const found = savedIds.find((existingId) => existingId === id);
      if (!found) {
        dispatch(
          setItem(idsItemName, (ids = []) => {
            if (position === 'start') {
              return [id, ...ids];
            }
              return [...ids, id];

          })
        );
        return true;
      }
      return false;
    },
    [dispatch, idsItemName, savedIds]
  );

  const removeItem = useCallback(
    (id) => {
      const index = savedIds.findIndex((existingId) => existingId === id);
      if (index !== -1) {
        dispatch(
          setItem(idsItemName, (ids = []) => [...ids.slice(0, index), ...ids.slice(index + 1)])
        );
        return true;
      }
      return false;
    },
    [dispatch, idsItemName, savedIds]
  );

  return {
    items,
    canLoadMore,
    request: customRequest,
    refresh,
    loadMore,
    addItem,
    removeItem
  };
}
