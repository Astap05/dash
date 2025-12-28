import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  autoConnect?: boolean
}

export function useWebSocket<T = any>(options: UseWebSocketOptions) {
  const { url, onMessage, onError, reconnectInterval = 3000, autoConnect = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        shouldReconnectRef.current = true
        if (import.meta.env.DEV) {
          console.log('WebSocket connected:', url)
        }
      }

      ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data)
          setData(parsedData)
          onMessage?.(parsedData)
        } catch (error) {
          // Если данные не JSON, передаем как есть
          console.warn('Failed to parse WebSocket message as JSON:', error)
          setData(event.data as any)
          onMessage?.(event.data)
        }
      }

      ws.onerror = (error) => {
        onError?.(error)
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        if (import.meta.env.DEV) {
          console.log('WebSocket closed:', event.code, event.reason || 'No reason')
        }
        if (shouldReconnectRef.current && autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      if (shouldReconnectRef.current && autoConnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, onMessage, onError, reconnectInterval, autoConnect])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return { isConnected, data, connect, disconnect, send }
}

