import { motion } from 'framer-motion'
import { formatMoney } from '../utils/money'
import { t } from '../i18n/ru'

export function BankHeader({
  bankMode,
  bankPool,
  onToggleMode,
  isDraggingBank,
  hoverValidBank,
  onBankPointerDown,
}) {
  return (
    <motion.header
      data-drop-zone="bank"
      layout
      className={`sticky top-0 z-30 border-b px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-shadow ${
        hoverValidBank
          ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/50'
          : 'border-slate-800 ring-0'
      } ${isDraggingBank ? 'bg-slate-900/95' : 'bg-slate-950/90'} backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">{t.appBadge}</p>
            <p className="text-lg font-semibold text-white">{t.bankCapital}</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onToggleMode}
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-amber-500/30"
          >
            {bankMode === 'infinite' ? `∞ ${t.infiniteMode}` : t.finiteMode}
          </motion.button>
        </div>
        <p className="text-sm text-emerald-300/90">
          {bankMode === 'infinite' ? t.infiniteLiquidity : `${t.poolLabel}: ${formatMoney(bankPool)}`}
        </p>

        <motion.div
          onPointerDown={onBankPointerDown}
          role="button"
          tabIndex={0}
          className={`flex min-h-[5.75rem] touch-none cursor-grab select-none flex-col items-center justify-center gap-1 rounded-2xl px-4 py-5 text-center ring-1 active:cursor-grabbing sm:min-h-[6.5rem] sm:py-6 ${
            isDraggingBank
              ? 'scale-[1.02] bg-slate-800/90 ring-amber-500/50'
              : 'bg-gradient-to-b from-slate-800/80 to-slate-900/90 ring-amber-500/20'
          }`}
          style={{ touchAction: 'none' }}
          animate={{ scale: isDraggingBank ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="text-base font-semibold text-amber-100 sm:text-lg">{t.dragFromBank}</span>
          <span className="max-w-[20rem] text-xs leading-snug text-slate-400 sm:text-sm">{t.dragFromBankHint}</span>
        </motion.div>
      </div>
    </motion.header>
  )
}
