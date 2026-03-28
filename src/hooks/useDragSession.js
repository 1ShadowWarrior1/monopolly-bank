import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import { vibrate } from './useNFC'

/** @typedef {{ kind: 'bank' } | { kind: 'player', playerId: string }} DropZone */

function resolveDropZoneFromPoint(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const root of stack) {
    let node = root
    let depth = 0
    while (node && depth < 14) {
      if (node.dataset?.dropZone === 'bank') return { kind: 'bank' }
      const pid = node.dataset?.playerId
      if (pid) return { kind: 'player', playerId: String(pid) }
      node = node.parentElement
      depth += 1
    }
  }
  return null
}

/**
 * Оверлей-перетаскивание: clientX/Y из событий + pointer capture на элементе,
 * чтобы на мобильном не терялся жест и не уезжал скролл.
 */
export function useDragSession({ onCommit, validateHover }) {
  const [session, setSession] = useState(null)
  const [hoverHint, setHoverHint] = useState(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const captureElRef = useRef(null)
  const onCommitRef = useRef(onCommit)

  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  const startDrag = useCallback(
    (event, payload) => {
      if (event.button !== undefined && event.button !== 0) return
      const el = event.currentTarget
      const pointerId = event.pointerId
      const rect = el.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const offsetY = event.clientY - rect.top
      x.set(event.clientX - offsetX)
      y.set(event.clientY - offsetY)
      vibrate([40])
      captureElRef.current = el
      try {
        el.setPointerCapture(pointerId)
      } catch {
        /* некоторые браузеры / события */
      }
      setSession({
        source: payload.source,
        label: payload.label,
        sub: payload.sub,
        offsetX,
        offsetY,
        width: rect.width,
        height: rect.height,
        pointerId,
      })
      setHoverHint(null)
    },
    [x, y],
  )

  useEffect(() => {
    if (!session) return
    const el = captureElRef.current
    const pid = session.pointerId
    if (el == null || pid === undefined) return

    const onMove = (ev) => {
      if (ev.pointerId !== pid) return
      if (ev.cancelable) ev.preventDefault()
      x.set(ev.clientX - session.offsetX)
      y.set(ev.clientY - session.offsetY)
      const zone = resolveDropZoneFromPoint(ev.clientX, ev.clientY)
      const hint = validateHover ? validateHover(session.source, zone) : { valid: false }
      setHoverHint(zone ? { zone, ...hint } : null)
    }

    const onEnd = (ev) => {
      if (ev.pointerId !== pid) return
      try {
        el.releasePointerCapture(pid)
      } catch {
        /* уже отпущено */
      }
      const zone = resolveDropZoneFromPoint(ev.clientX, ev.clientY)
      vibrate([40])
      onCommitRef.current?.(session.source, zone)
      captureElRef.current = null
      setSession(null)
      setHoverHint(null)
    }

    el.addEventListener('pointermove', onMove, { passive: false })
    el.addEventListener('pointerup', onEnd)
    el.addEventListener('pointercancel', onEnd)

    return () => {
      try {
        el.releasePointerCapture(pid)
      } catch {
        /* */
      }
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onEnd)
      el.removeEventListener('pointercancel', onEnd)
    }
  }, [session, validateHover, x, y])

  return { session, startDrag, ghostMotion: { x, y }, hoverHint }
}
