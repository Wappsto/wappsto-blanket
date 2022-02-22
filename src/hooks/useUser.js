import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRequest } from './useRequest'
import { getUserData } from 'wappsto-redux'

export function useUser() {
  const user = useSelector(getUserData)
  const { request, send } = useRequest()

  useEffect(() => {
    if (!user) {
      send({
        method: 'get',
        url: '/user',
        query: { expand: 1 },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let name = ''
  if (user) {
    if (user.nickname) {
      name = user.nickname
    } else {
      if (user.first_name) {
        name += user.first_name + ' '
      }
      if (user.last_name) {
        name += user.last_name
      }

      if (!name) {
        if (user.provider[0] && user.provider[0].name) {
          name = user.provider[0].name
        } else {
          name = user.email
        }
      }
    }
  }

  const icon = user?.provider?.[0]?.picture
  const status = request?.status || 'pending'

  return { status, icon, name, user, request }
}
