import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { t } from '../i18n/ru'
import { formatMoney } from '../utils/money'

export function SettingsDialog({
  open,
  onClose,
  onResetPlayers,
  onRemovePlayer,
  startingBalance,
  onSetStartingBalance,
  playersCount,
  players,
}) {
  const [tempBalance, setTempBalance] = useState(startingBalance)

  const handleOpen = () => {
    setTempBalance(startingBalance)
  }

  const handleSaveBalance = () => {
    const value = Math.max(0, Math.floor(Number(tempBalance) || 0))
    onSetStartingBalance(value)
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOpen}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.settingsTitle}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-white">{t.settingsTitle}</p>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-xl bg-slate-950/80 p-4 ring-1 ring-slate-800">
                <p className="text-xs font-medium text-slate-400">{t.startingBalanceLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{t.startingBalanceHint}</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-600 focus:border-amber-500/50"
                    min={0}
                    step={100}
                  />
                </div>
                <p className="mt-2 text-xs text-emerald-400">{formatMoney(tempBalance)}</p>
              </div>

              {playersCount > 0 ? (
                <div className="rounded-xl bg-red-950/30 p-4 ring-1 ring-red-900/50">
                  <p className="text-sm font-medium text-red-300">{t.resetCashSection}</p>
                  <p className="mt-1 text-xs text-red-400/80">{t.resetCashHint}</p>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onResetPlayers()
                      onClose()
                    }}
                    className="mt-3 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white ring-1 ring-red-500/50"
                  >
                    {t.resetCash}
                  </motion.button>
                </div>
              ) : null}

              {playersCount > 0 ? (
                <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-slate-700">
                  <p className="text-sm font-medium text-slate-300">Удаление игроков</p>
                  <p className="mt-1 text-xs text-slate-500">Нажмите на игрока, чтобы удалить</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {players?.map((p) => (
                      <motion.button
                        key={p.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onRemovePlayer(p.id)}
                        className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-slate-700 hover:bg-red-900/30 hover:text-red-300 hover:border-red-800"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="ml-2 text-xs text-slate-500">{formatMoney(p.balance)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 border-t border-slate-800 px-4 pb-4 pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="h-12 flex-1 rounded-2xl bg-slate-800 text-sm font-medium text-slate-200 ring-1 ring-slate-700"
                onClick={onClose}
              >
                {t.cancel}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveBalance}
                className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-sm font-semibold text-white ring-1 ring-amber-400/40"
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
