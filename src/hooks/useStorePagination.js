import { useEffect } from 'react';
import usePagination from './usePagination';
import useEntitiesSelector from './useEntitiesSelector';

export default function useStorePagination(...props) {
  const { items, removeItem, ...rest } = usePagination(...props);
  const storeItems = useEntitiesSelector(
    items?.[0]?.meta?.type,
    items?.map((item) => item?.meta?.id)
  );

  useEffect(() => {
    if (items && storeItems.length !== items.length) {
      items.forEach((item) => {
        if (!storeItems.find((i) => i?.meta?.id === item?.meta?.id)) {
          removeItem(item);
        }
      });
    }
  }, [storeItems, items, removeItem]);

  return { items: storeItems, removeItem, ...rest };
}
