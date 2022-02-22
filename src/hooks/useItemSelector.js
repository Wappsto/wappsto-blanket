import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { makeItemSelector } from 'wappsto-redux'

export function useItemSelector(itemName) {
  const getItem = useMemo(makeItemSelector, [])
  const item = useSelector((state) => getItem(state, itemName))
  return item
}
