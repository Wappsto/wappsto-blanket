import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { makeEntitySelector } from 'wappsto-redux/selectors/entities'

const useEntitySelector = (type, options) => {
  const getEntity = useMemo(makeEntitySelector, [])
  const entity = useSelector((state) => getEntity(state, type, options))
  return entity
}

export default useEntitySelector
