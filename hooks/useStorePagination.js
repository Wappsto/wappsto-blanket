import { useEffect } from 'react';
import usePagination from './usePagination';
import useEntitiesSelector from 'wappsto-blanket/hooks/useEntitiesSelector';

const useStorePagination = ({ url, query, page: pageNo, pageSize }) => {
  const { items, count, page, setPage, refresh, status, requests, addItem, removeItem } = usePagination({ url, query, page: pageNo, pageSize });
  const firstItem = items && items[0];
  const storeItems = useEntitiesSelector(firstItem?.meta?.type, items?.map((item) => item?.meta?.id));

  useEffect(() => {
    if(storeItems.length !== items.length){
      items.forEach(item => {
        if(!storeItems.find(i => i?.meta?.id === item?.meta?.id)){
          removeItem(item);
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ storeItems ]);

  return { items: storeItems, count, page, setPage, refresh, status, requests, addItem, removeItem };
}

export default useStorePagination;
