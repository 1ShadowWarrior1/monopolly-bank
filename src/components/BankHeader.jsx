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
      <div className="mx-auto flex max-w-lg flex-col gap-2">
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
          className={`touch-none cursor-grab select-none rounded-2xl px-3 py-3 text-center text-xs text-slate-300 ring-1 active:cursor-grabbing ${
            isDraggingBank
              ? 'scale-[1.02] bg-slate-800/90 ring-amber-500/50'
              : 'bg-slate-900/60 ring-slate-800'
          }`}
          style={{ touchAction: 'none' }}
          animate={{ scale: isDraggingBank ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="font-medium text-amber-200/90">{t.dragFromBank}</span>
          <span className="text-slate-500"> — {t.dragFromBankHint}</span>
        </motion.div>
      </div>
    </motion.header>
  )
}
