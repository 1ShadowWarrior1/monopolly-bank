import { useCallback, useEffect, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import { vibrate } from './useNFC'

/** @typedef {{ kind: 'bank' } | { kind: 'player', playerId: string }} DropZone */

/** @typedef {{
 *   source: { type: 'bank' } | { type: 'player', playerId: string },
 *   offsetX: number,
 *   offsetY: number,
 *   label: string,
 *   sub?: string,
 * }} DragPayload */

function resolveDropZoneFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY)
  if (!el) return null
  let node = el
  for (let i = 0; i < 12 && node; i++) {
    if (node.dataset?.dropZone === 'bank') return { kind: 'bank' }
    const pid = node.dataset?.playerId
    if (pid) return { kind: 'player', playerId: String(pid) }
    node = node.parentElement
  }
  return null
}

/**
 * Overlay drag using viewport clientX/clientY so scroll/transform do not cause drift.
 * Ghost uses motion transform x/y; card stays in place in the grid.
 */
export function useDragSession({ onCommit, validateHover }) {
  const [session, setSession] = useState(null)
  const [hoverHint, setHoverHint] = useState(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const startDrag = useCallback(
    (event, payload) => {
      if (event.button !== undefined && event.button !== 0) return
      const rect = event.currentTarget.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const offsetY = event.clientY - rect.top
      x.set(event.clientX - offsetX)
      y.set(event.clientY - offsetY)
      vibrate(40)
      setSession({
        source: payload.source,
        label: payload.label,
        sub: payload.sub,
        offsetX,
        offsetY,
        width: rect.width,
        height: rect.height,
      })
      setHoverHint(null)
    },
    [x, y],
  )

  useEffect(() => {
    if (!session) return

    const onMove = (ev) => {
      x.set(ev.clientX - session.offsetX)
      y.set(ev.clientY - session.offsetY)
      const zone = resolveDropZoneFromPoint(ev.clientX, ev.clientY)
      const hint = validateHover ? validateHover(session.source, zone) : { valid: false }
      setHoverHint(zone ? { zone, ...hint } : null)
    }

    const finish = (ev) => {
      const zone = resolveDropZoneFromPoint(ev.clientX, ev.clientY)
      vibrate(40)
      onCommit?.(session.source, zone)
      setSession(null)
      setHoverHint(null)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', finish, { passive: true })
    window.addEventListener('pointercancel', finish, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  }, [session, onCommit, validateHover, x, y])

  return { session, startDrag, ghostMotion: { x, y }, hoverHint }
}
