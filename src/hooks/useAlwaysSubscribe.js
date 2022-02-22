import { useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { usePrevious } from './usePrevious'
import { updateStream } from '../util'
import { onLogout } from 'wappsto-redux'

let cache = {}
onLogout(() => (cache = {}))

export function useAlwaysSubscribe(items) {
  const dispatch = useDispatch()
  const arr = useMemo(() => {
    const result = []
    const allItems = items ? (items.constructor === Array ? items : [items]) : []
    allItems.forEach((item) => {
      const itemPath = '/' + item.meta.type + '/' + item.meta.id
      if (!cache[itemPath]) {
        cache[itemPath] = true
        result.push(itemPath)
      }
    })
    return result
  }, [items])
  const prevArr = usePrevious(arr)

  // subscribe to stream
  useEffect(() => {
    //remove old subscriptions
    if (prevArr) {
      prevArr.forEach((itemPath) => {
        delete cache[itemPath]
      })
      updateStream(dispatch, prevArr, 'remove')
    }

    //add new subscriptions
    updateStream(dispatch, arr, 'add')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])
}
