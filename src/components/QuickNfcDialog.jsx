import { AnimatePresence, motion } from 'framer-motion'
import { t } from '../i18n/ru'

export function QuickNfcDialog({ open, fromPlayer, players, onClose, onPickBank, onPickPlayer }) {
  if (!fromPlayer) return null
  const others = players.filter((p) => p.id !== fromPlayer.id)

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.quickNfcTitle}
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
                {t.quickNfcTitle}
              </p>
              <p className="mt-1 text-sm text-slate-300">{t.quickFrom(fromPlayer.name)}</p>
              <p className="mt-2 text-sm font-medium text-white">{t.quickNfcWho}</p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/90 py-3 text-left text-sm font-medium text-amber-100 ring-1 ring-amber-500/35 px-4"
                onClick={onPickBank}
              >
                {t.quickToBank}
              </motion.button>

              {others.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-slate-800/90 py-3 text-left text-sm text-white ring-1 ring-slate-700 px-4"
                  onClick={() => onPickPlayer(p.id)}
                >
                  {t.quickToPlayer(p.name)}
                </motion.button>
              ))}
            </div>

            <div className="border-t border-slate-800 p-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-medium text-slate-300 ring-1 ring-slate-700"
                onClick={onClose}
              >
                {t.cancel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
