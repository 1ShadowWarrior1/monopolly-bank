import { useCallback, useEffect, useRef, useState } from 'react'

/** @param {number | number[]} [pattern] */
export function vibrate(pattern = [40]) {
  try {
    const p = typeof pattern === 'number' ? [pattern] : pattern
    navigator.vibrate?.(p)
  } catch {
    /* no-op */
  }
}

/**
 * Web NFC (NDEFReader). Chrome on Android with hardware support.
 */
export function useNFC() {
  const [supported, setSupported] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastError, setLastError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'NDEFReader' in window)
  }, [])

  const stopScan = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setScanning(false)
  }, [])

  /** @returns {Promise<string>} serialNumber from tag */
  const readTagOnce = useCallback(async () => {
    if (!supported) {
      const e = new Error('Web NFC is not available in this browser')
      setLastError(e.message)
      throw e
    }
    setLastError(null)
    const reader = new NDEFReader()
    const ac = new AbortController()
    abortRef.current = ac
    setScanning(true)

    try {
      await reader.scan({ signal: ac.signal })
      const serial = await new Promise((resolve, reject) => {
        const cleanup = () => {
          reader.removeEventListener('reading', onRead)
          reader.removeEventListener('readingerror', onErr)
        }
        const onRead = (ev) => {
          vibrate([40])
          cleanup()
          resolve(String(ev.serialNumber ?? ''))
        }
        const onErr = () => {
          cleanup()
          reject(new Error('NFC read failed'))
        }
        reader.addEventListener('reading', onRead, { once: true })
        reader.addEventListener('readingerror', onErr, { once: true })
      })
      return serial
    } finally {
      setScanning(false)
      abortRef.current = null
    }
  }, [supported])

  /** Continuous scan: calls onSerial(serial) for each tap */
  const watchSerial = useCallback(
    (onSerial, options = {}) => {
      if (!supported) return () => {}
      const reader = new NDEFReader()
      const ac = new AbortController()
      const { signal: outer } = options
      if (outer) {
        outer.addEventListener('abort', () => ac.abort(), { once: true })
      }

      reader.scan({ signal: ac.signal }).catch(() => {})

      const handler = (ev) => {
        vibrate([40])
        onSerial(String(ev.serialNumber ?? ''))
      }
      reader.addEventListener('reading', handler)

      return () => {
        ac.abort()
        reader.removeEventListener('reading', handler)
      }
    },
    [supported],
  )

  return {
    supported,
    scanning,
    lastError,
    readTagOnce,
    watchSerial,
    stopScan,
  }
}
