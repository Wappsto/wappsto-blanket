import { useState, useEffect, useMemo } from 'react';
import { useStore } from 'react-redux';
import { startRequest } from 'wappsto-redux/actions/request';
import { addEntities } from 'wappsto-redux/actions/entities';
import { getSession } from 'wappsto-redux/selectors/session';
import schemas from 'wappsto-redux/util/schemas';
import { ITEMS_PER_SLICE } from '../util';
import querystring from 'query-string';

const CHILDREN = { 'network': 'device', 'device': 'value', 'value': 'state' }

const fetch = async (ids, type, store, query, lvl = 0, useCache) => {
  const state = store.getState();
  const uniqIds = [...new Set(ids)];
  const typeKey = schemas.getSchemaTree(type).name;

  let missingIds;
  if (useCache && state.entities[typeKey]) {
    missingIds = uniqIds.filter(id => !state.entities[typeKey][id]);
  } else {
    missingIds = uniqIds;
  }

  const slices = [];
  let index = 0;
  while (index < missingIds.length) {
    slices.push(missingIds.slice(index, ITEMS_PER_SLICE + index));
    index += ITEMS_PER_SLICE;
  }

  const promises = slices.map((e) => {
    const url = `/${type}?expand=0&id=[${e.join(',')}]&${querystring.stringify(query)}`;
    const session = getSession(state);
    const promise = startRequest(store.dispatch, { url, method: 'GET' }, session);
    return promise;
  });

  let itemList = [];
  const results = await Promise.all(promises);
  results.forEach((e) => {
    if (e.status !== 200 || e.status === false) {
      throw e;
    }
    if (e.json) {
      store.dispatch(addEntities(type, e.json, {reset: false}));
      itemList = [...itemList, ...e.json];
    }
  });

  const cachedResults = state.entities[typeKey];
  if (useCache && cachedResults) {
    const cachedIds = uniqIds.filter(id => state.entities[typeKey][id]);
    cachedIds.forEach((e) => {
      const item = cachedResults[e];
      if (item && !itemList.find(i => i.meta.id === e)) {
        itemList.push(item);
      }
    });
  }

  if(lvl > 0 && itemList.length) {
    const itemListIds = itemList.reduce((arr, e) => [...arr, ...(e[CHILDREN[type]] || [])], []);
    const result = await fetch(itemListIds, CHILDREN[type], store, query, lvl-1, useCache);
    return { [type]: itemList, ...result };
  } else {
    return type ? { [type]: itemList } : {};
  }
}

const useFetchItems = (objIds, query, useCache=true) => {
  const store = useStore();
  const [[status, items], setState] = useState(['pending', {}]);
  const [queryClone, lvl] = useMemo(() => {
    if(query && query.constructor === Object){
      const queryClone = {...query};
      const lvl = queryClone.expand;
      if(queryClone.hasOwnProperty('expand')){
        delete queryClone.expand;
      }
      if(!queryClone.hasOwnProperty('from_last')){
        queryClone.from_last = true;
      }
      return [queryClone, lvl];
    }
    return [null, query];
  }, [query]);

  useEffect(() => {
    let mounted = true;

    if (status !== 'pending') {
      setState(['pending', {}]);
    }

    const startFetching = async () => {
      let items = {};
      for (const [type, ids] of Object.entries(objIds || {})) {
        if (CHILDREN[type] || type === 'state') {
          const response = await fetch(ids, type, store, queryClone, lvl, useCache);
          items[type] = response;
        } else {
          const response = await fetch(ids, type, store, queryClone, 0, useCache);
          Object.assign(items, response);
        }
      }
      if (mounted) {
        setState(['success', items]);
      }
    }

    startFetching().catch((error) => {
      if (mounted) {
        setState(['error', {}]);
      }
    });

    return () => mounted = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objIds, query]);

  return { status, items };
}

export default useFetchItems;
