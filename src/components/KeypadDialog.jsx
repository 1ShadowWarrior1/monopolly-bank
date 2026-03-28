import { AnimatePresence, motion } from 'framer-motion'
import { formatMoney, keypadToCents } from '../utils/money'
import { t } from '../i18n/ru'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'С', '0', '⌫']

export function KeypadDialog({
  open,
  title,
  subtitle,
  digits,
  onDigitsChange,
  onConfirm,
  onCancel,
  canConfirm,
  nfcActivePlayerName,
}) {
  const cents = keypadToCents(digits)

  const append = (k) => {
    if (k === 'С') {
      onDigitsChange('')
      return
    }
    if (k === '⌫') {
      onDigitsChange(digits.slice(0, -1))
      return
    }
    if (digits.length >= 12) return
    onDigitsChange(digits + k)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-emerald-950/40"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">{title}</p>
              {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
              {nfcActivePlayerName ? (
                <p className="mt-2 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                  {t.nfcCardHint(nfcActivePlayerName)}
                </p>
              ) : null}
            </div>

            <div className="px-4 pt-4">
              <div className="rounded-2xl bg-slate-950/80 px-4 py-4 text-center ring-1 ring-slate-800">
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                  {formatMoney(cents)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t.keypadAmountHint}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-4">
              {KEYS.map((k) => (
                <motion.button
                  key={k}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  className={`h-14 rounded-2xl text-lg font-semibold sm:h-16 sm:text-xl ${
                    k === 'С'
                      ? 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30'
                      : 'bg-slate-800/90 text-white ring-1 ring-slate-700'
                  }`}
                  onClick={() => append(k)}
                >
                  {k}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2 border-t border-slate-800 px-4 py-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="h-12 flex-1 rounded-2xl bg-slate-800 font-medium text-slate-200 ring-1 ring-slate-700"
                onClick={onCancel}
              >
                {t.cancel}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={!canConfirm}
                className={`h-12 flex-1 rounded-2xl font-semibold ring-1 ${
                  canConfirm
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ring-emerald-400/40'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500 ring-slate-700'
                }`}
                onClick={() => onConfirm(cents)}
              >
                {t.confirm}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
