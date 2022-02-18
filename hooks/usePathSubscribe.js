import { useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updateStream } from '../util'
import { onLogout } from 'wappsto-redux/events'

let cache = {}
onLogout(() => (cache = {}))

const usePathSubscribe = (items, cacheId) => {
  const dispatch = useDispatch()
  const arr = useMemo(
    () => (items ? (items.constructor === Array ? items : [items]) : []),
    [items]
  )
  const path = useMemo(() => window.location.pathname, [])

  // subscribe to stream
  useEffect(() => {
    if (!cache[cacheId]) {
      updateStream(
        dispatch,
        arr.map((item) => '/' + item.meta.type + '/' + item.meta.id),
        'add'
      )
    }
    return () => {
      if (window.location.pathname !== path) {
        updateStream(
          dispatch,
          arr.map((item) => '/' + item.meta.type + '/' + item.meta.id),
          'remove'
        )
        delete cache[cacheId]
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])
}

export default usePathSubscribe
