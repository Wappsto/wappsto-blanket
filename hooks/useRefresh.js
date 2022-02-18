import { useState, useEffect } from 'react'

const useRefresh = (time) => {
  const [, setRefresh] = useState()
  useEffect(() => {
    let timer
    if (time) {
      timer = setInterval(() => setRefresh({}), time)
    }
    return () => {
      clearInterval(timer)
    }
  }, [time])
}

export default useRefresh
