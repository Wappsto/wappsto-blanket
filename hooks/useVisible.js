import { useState, useCallback } from 'react';

function useVisible(initialValue){
  const [ visible, setVisible ] = useState(false);

  const show = useCallback(() => {
    setVisible(true);
  }, [])

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return [ visible, show, hide];
}

export default useVisible;
