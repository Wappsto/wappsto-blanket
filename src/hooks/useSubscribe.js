import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import equal from 'deep-equal';
import { updateStream } from '../util';

export default function useSubscribe(type, ids) {
  const dispatch = useDispatch();
  const cached = useRef([]);
  const arr = useMemo(() => {
    let data;
    if (ids) {
      if (ids.constructor === Array) {
        data = ids.map((id) => `/${type}/${id}`);
      } else {
        data = [`/${type}/${ids}`];
      }
    }
    if (!equal(data, cached.current)) {
      cached.current = data;
    }
    return cached.current;
  }, [type, ids]);

  // subscribe to stream
  useEffect(() => {
    if (arr) {
      updateStream(dispatch, arr, 'add');
    }
    return () => {
      if (arr) {
        updateStream(dispatch, arr, 'remove');
      }
    };
  }, [arr, dispatch]);
}
