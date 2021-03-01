import { useEffect } from 'react';
import usePagination from './usePagination';
import useEntitiesSelector from './useEntitiesSelector';

const useStorePagination = (...props) => {
  const { items, removeItem, updateItem, ...rest } = usePagination(...props);
  const storeItems = useEntitiesSelector(items?.[0]?.meta?.type, items?.map((item) => item?.meta?.id));

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

  return { items: storeItems, removeItem, ...rest };
}

export default useStorePagination;
