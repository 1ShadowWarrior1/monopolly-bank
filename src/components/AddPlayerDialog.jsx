import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { t } from '../i18n/ru'

export function AddPlayerDialog({
  open,
  onClose,
  onSubmit,
  nfcSupported,
  onScanNfc,
  scanBusy,
}) {
  const [name, setName] = useState('')
  const [nfcSerial, setNfcSerial] = useState('')

  const close = () => {
    setName('')
    setNfcSerial('')
    onClose()
  }

  const handleScan = async () => {
    const serial = await onScanNfc()
    if (serial) setNfcSerial(serial)
  }

  const submit = () => {
    const r = onSubmit(name.trim(), nfcSerial)
    if (r.ok) close()
    return r
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.addPlayerTitle}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-white">{t.addPlayerTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{t.addPlayerNfcHint}</p>
            </div>

            <div className="space-y-3 p-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-400">{t.addPlayerNameLabel}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.addPlayerNamePh}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-600 focus:border-amber-500/50"
                  autoComplete="off"
                  maxLength={32}
                />
              </label>

              <div className="rounded-xl bg-slate-950/80 p-3 ring-1 ring-slate-800">
                <p className="text-xs text-slate-500">{t.nfcAtCreateOnly}</p>
                {nfcSerial ? (
                  <p className="mt-2 break-all text-xs font-mono text-emerald-300">{nfcSerial}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-600">{t.nfcNotScanned}</p>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={!nfcSupported || scanBusy}
                  onClick={handleScan}
                  className={`mt-3 w-full rounded-xl py-3 text-sm font-medium ring-1 ${
                    nfcSupported
                      ? 'bg-emerald-950/50 text-emerald-200 ring-emerald-600/40'
                      : 'cursor-not-allowed bg-slate-800 text-slate-600 ring-slate-800'
                  }`}
                >
                  {scanBusy ? '…' : t.scanNfcForNewPlayer}
                </motion.button>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800 px-4 pb-4 pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="h-12 flex-1 rounded-2xl bg-slate-800 text-sm font-medium text-slate-200 ring-1 ring-slate-700"
                onClick={close}
              >
                {t.cancel}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={!name.trim()}
                className={`h-12 flex-1 rounded-2xl text-sm font-semibold ring-1 ${
                  name.trim()
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 ring-amber-400/40'
                    : 'cursor-not-allowed bg-slate-800 text-slate-600 ring-slate-700'
                }`}
                onClick={() => submit()}
              >
                {t.addPlayerSubmit}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
