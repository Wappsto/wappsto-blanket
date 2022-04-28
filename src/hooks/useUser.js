import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserData } from 'wappsto-redux';
import useRequest from './useRequest';
import { STATUS } from '../util';

export default function useUser() {
  const user = useSelector(getUserData);
  const { request, send } = useRequest();

  useEffect(() => {
    if (!user) {
      send({
        method: 'get',
        url: '/user',
        query: { expand: 1 },
      });
    }
  }, [user, send]);

  const name = user?.name ?? '';
  const icon = user?.provider?.[0]?.picture;
  const status = request?.status || STATUS.SUCCESS;

  return { status, icon, name, user };
}
