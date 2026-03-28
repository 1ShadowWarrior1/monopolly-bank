import { motion } from 'framer-motion'
import { formatMoney } from '../utils/money'
import { t } from '../i18n/ru'

export function PlayerCard({
  player,
  isSource,
  hoverValidHere,
  hoverInvalidHere,
  onPlayerPointerDown,
}) {
  return (
    <motion.article
      data-player-id={player.id}
      layout
      className={`relative flex flex-col rounded-2xl border p-2 shadow-lg select-none ${
        hoverValidHere
          ? 'border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
          : hoverInvalidHere
            ? 'border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
            : 'border-slate-800'
      } ${isSource ? 'bg-slate-900/40 opacity-50' : 'bg-slate-900/80'}`}
      style={{ touchAction: 'none' }}
      animate={{ scale: isSource ? 0.97 : 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={(e) => onPlayerPointerDown(e, player)}
        className="min-h-[88px] cursor-grab touch-none rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-2 ring-1 ring-slate-700/80 active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
          {player.name}
        </p>
        <p className="mt-1 text-center text-sm font-semibold tabular-nums text-white sm:text-base">
          {formatMoney(player.balance)}
        </p>
        <p className="mt-1 text-center text-[10px] text-slate-500">{t.dragPlayerHint}</p>
        {player.nfcSerial ? (
          <p className="mt-1.5 text-center text-[9px] font-medium uppercase tracking-wide text-emerald-400/90">
            {t.nfcLinkedBadge}
          </p>
        ) : null}
      </div>
    </motion.article>
  )
}
