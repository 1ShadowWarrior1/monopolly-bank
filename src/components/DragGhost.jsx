import { motion } from 'framer-motion'

export function DragGhost({ session, ghostMotion }) {
  if (!session) return null
  const { x, y } = ghostMotion

  return (
    <motion.div
      pointerEvents="none"
      className="fixed left-0 top-0 z-[100] flex flex-col justify-center rounded-2xl border border-amber-500/40 bg-slate-900/95 px-3 py-2 ring-2 ring-amber-400/30"
      style={{
        x,
        y,
        width: session.width,
        height: session.height,
        boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
      }}
      initial={{ scale: 1 }}
      animate={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-amber-200">
        {session.label}
      </p>
      {session.sub ? (
        <p className="mt-0.5 truncate text-center text-[10px] text-slate-400">{session.sub}</p>
      ) : null}
    </motion.div>
  )
}
