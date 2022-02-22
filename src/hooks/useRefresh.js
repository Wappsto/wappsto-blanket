import { useState, useEffect } from 'react'

export function useRefresh(time) {
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
