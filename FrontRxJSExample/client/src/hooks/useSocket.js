import { useEffect } from 'react'
import io from 'socket.io-client'

const URL = 'localhost:8082';

function useSocket({
  subscribeEvent,
  subscribeEventHandler,
}) {
  useEffect(() => {
    const socket = io(URL)
    socket.on(subscribeEvent, data => {
      subscribeEventHandler(data)
    })
    return () => socket.disconnect()
  }, [])
}

export default useSocket
