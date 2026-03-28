import { motion } from 'framer-motion'
import { formatMoney } from '../utils/money'

export function PlayerCard({
  player,
  isSource,
  hoverValidHere,
  hoverInvalidHere,
  onPlayerPointerDown,
  onBindNfc,
  nfcBusy,
  nfcSupported,
}) {
  return (
    <motion.article
      data-player-id={player.id}
      layout
      className={`relative flex flex-col rounded-2xl border p-2 shadow-lg touch-none ${
        hoverValidHere
          ? 'border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
          : hoverInvalidHere
            ? 'border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
            : 'border-slate-800'
      } ${isSource ? 'bg-slate-900/40 opacity-50' : 'bg-slate-900/80'}`}
      animate={{ scale: isSource ? 0.97 : 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={(e) => onPlayerPointerDown(e, player)}
        className="min-h-[88px] cursor-grab rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-2 ring-1 ring-slate-700/80 active:cursor-grabbing"
      >
        <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
          {player.name}
        </p>
        <p className="mt-1 text-center text-sm font-semibold tabular-nums text-white sm:text-base">
          {formatMoney(player.balanceCents)}
        </p>
        <p className="mt-1 text-center text-[10px] text-slate-500">Drag — pay / transfer</p>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={!nfcSupported || nfcBusy}
        onClick={(e) => {
          e.stopPropagation()
          onBindNfc(player.id)
        }}
        className={`mt-2 rounded-lg py-1.5 text-[10px] font-medium ring-1 ${
          nfcSupported
            ? 'bg-slate-800 text-emerald-200 ring-emerald-600/40'
            : 'cursor-not-allowed bg-slate-800/50 text-slate-600 ring-slate-800'
        }`}
      >
        {player.nfcSerial ? 'Re-bind NFC' : 'Bind NFC card'}
      </motion.button>
    </motion.article>
  )
}
