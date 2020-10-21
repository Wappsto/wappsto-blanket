import { useState, useEffect } from 'react';
import { useStore } from 'react-redux';
import { startRequest } from 'wappsto-redux/actions/request';
import { addEntities } from 'wappsto-redux/actions/entities';
import { getSession } from 'wappsto-redux/selectors/session';

const ITEMS_PER_SLICE = 100;
const CHILDREN = { 'network': 'device', 'device': 'value', 'value': 'state' }

const fetch = async (ids, type, store, lvl = 0) => {
  const state = store.getState();
  const uniqIds = [...new Set(ids)];

  let missingIds;
  if (state.entities[type+'s']) {
    missingIds = uniqIds.filter(id => !state.entities[type+'s'][id]);
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
    const url = `/${type}?expand=0&id=[${e.join(',')}]&from_last=true`;
    const session = getSession(state);
    const promise = startRequest(store.dispatch, url, 'GET', null, {}, session);
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

  const cachedResults = state.entities[type+'s'];
  if (cachedResults) {
    const cachedIds = uniqIds.filter(id => state.entities[type+'s'][id]);
    cachedIds.forEach((e) => {
      const item = cachedResults[e];
      if (item) {
        itemList = [...itemList, item];
      }
    })
  }

  if(lvl > 0 && itemList.length) {
    const itemListIds = itemList.reduce((arr, e) => [...arr, ...(e[CHILDREN[type]] || [])], []);
    const result = await fetch(itemListIds, CHILDREN[type], store, lvl-1);
    return { [type]: itemList, ...result };
  } else {
    return type ? { [type]: itemList } : {};
  }
}

const useFetchItems = (objIds, expand) => {
  const store = useStore();
  const [[status, items], setState] = useState(['pending', {}]);

  useEffect(() => {
    let mounted = true;

    if (status !== 'pending') {
      setState(['pending', {}]);
    }

    const startFetching = async () => {
      let items = {};
      for (const [type, ids] of Object.entries(objIds || {})) {
        if (CHILDREN[type] || type === 'state') {
          const response = await fetch(ids, type, store, expand);
          items[type] = response;
        } else {
          const response = await fetch(ids, type, store, 0);
          items = response[type];
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
  }, [objIds, expand]);

  return { status, items };
}

export default useFetchItems;
