import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import {
  setItem,
  makeEntitiesSelector,
  makeItemSelector,
  getSession,
  startRequest,
  onLogout,
} from 'wappsto-redux';
import equal from 'deep-equal';
import usePrevious from './usePrevious';
import { STATUS, ITEMS_PER_SLICE } from '../util';

const itemName = 'useIds_status';

let cache = {};
onLogout(() => (cache = {}));

function setCacheStatus(dispatch, ids, status, query) {
  ids.forEach((id) => (cache[id] = { status, query }));
  dispatch(setItem(itemName, { ...cache }));
}

function sendGetIds(store, ids, service, query, sliceLength) {
  const res = [];
  const slices = Math.ceil(ids.length / sliceLength);
  for (let i = 0; i < slices; i += 1) {
    res.push(ids.slice(i * sliceLength, (i + 1) * sliceLength));
  }
  const state = store.getState();
  const session = getSession(state);
  res.forEach((arr) => {
    const options = {
      url: `/${service}`,
      method: 'GET',
      query: {
        ...query,
        id: arr,
      },
    };
    const promise = startRequest(store.dispatch, options, session);
    promise
      .then((result) => {
        setCacheStatus(store.dispatch, arr, result.ok ? STATUS.SUCCESS : STATUS.ERROR, query);
      })
      .catch(() => {
        setCacheStatus(store.dispatch, arr, STATUS.ERROR, query);
      });
  });
}

export default function useIds(service, ids, query = {}, sliceLength = ITEMS_PER_SLICE) {
  const store = useStore();
  const [status, setStatus] = useState(STATUS.IDLE);
  const prevStatus = usePrevious(status);
  const prevIds = usePrevious(ids);
  const missingIds = useRef([]);
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const getEntities = useMemo(makeEntitiesSelector, []);
  const getItem = useMemo(makeItemSelector, []);
  const cacheItems = useSelector((state) => getEntities(state, service, ids));
  const idsStatus = useSelector((state) => getItem(state, itemName));

  const updateMissingIds = useCallback(() => {
    if (equal(ids, prevIds)) {
      return [];
    }
    const arr = [];
    const cacheIds = [];
    ids.forEach((id) => {
      const cid = cache[id];
      if (cid) {
        const cidQ = { ...cid.query, expand: null };
        const cQ = { ...query, expand: null };
        if (
          !equal(cidQ, cQ) ||
          cid.query.expand < query.expand ||
          cid.status === STATUS.ERROR ||
          cid.status === STATUS.IDLE
        ) {
          arr.push(id);
        }
      } else if (!query || !query.expand || query.expand === 0) {
        const found = cacheItems.find((item) => item.meta.id === id);
        if (found) {
          cacheIds.push(id);
        } else {
          arr.push(id);
        }
      } else {
        arr.push(id);
      }
    });
    const prevMissingIds = missingIds.current;
    missingIds.current = arr;
    if (cacheIds.length > 0) {
      setCacheStatus(dispatch, cacheIds, STATUS.SUCCESS, query);
    }
    return prevMissingIds;
  }, [ids, cacheItems, dispatch, prevIds, query]);

  const getMissingIds = useCallback(
    (checkIds = true) => {
      if (checkIds && equal(ids, prevIds)) {
        return;
      }
      updateMissingIds();
      if (missingIds.current.length > 0) {
        setCacheStatus(dispatch, missingIds.current, STATUS.PENDING, query);
        sendGetIds(store, missingIds.current, service, query, sliceLength);
      }
    },
    [dispatch, ids, prevIds, query, service, sliceLength, store, updateMissingIds],
  );

  useEffect(() => {
    // Make request to get the ids
    getMissingIds();

    // Update status
    if (status !== STATUS.SUCCESS || prevIds !== ids) {
      for (let i = 0; i < ids.length; i += 1) {
        const idStatus = cache[ids[i]] && cache[ids[i]].status;
        if (idStatus === STATUS.ERROR) {
          setStatus(STATUS.ERROR);
          return;
        }
        if (idStatus === STATUS.PENDING) {
          setStatus(STATUS.PENDING);
          return;
        }
      }
      setStatus(STATUS.SUCCESS);
      setItems(cacheItems);
    } else if (prevStatus !== STATUS.SUCCESS && status === STATUS.SUCCESS) {
      setItems(cacheItems);
    }

    if (status === STATUS.SUCCESS) {
      setItems(cacheItems);
    }
  }, [
    dispatch,
    service,
    updateMissingIds,
    ids,
    idsStatus,
    cacheItems,
    getMissingIds,
    prevIds,
    prevStatus,
    status,
  ]);

  // Reset current ids cache
  const reset = useCallback(() => {
    setCacheStatus(dispatch, ids, STATUS.IDLE, query);
  }, [ids, dispatch, query]);

  // Refresh
  const refresh = useCallback(
    (callReset = true) => {
      if (callReset) {
        reset();
      }
      getMissingIds(false);
    },
    [getMissingIds, reset],
  );

  return { items, status, setStatus, reset, refresh };
}
