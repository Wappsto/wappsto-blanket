import { useState, useCallback } from 'react';

export function useVisible(initialValue) {
  const [visible, setVisible] = useState(initialValue);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return [visible, show, hide];
}
