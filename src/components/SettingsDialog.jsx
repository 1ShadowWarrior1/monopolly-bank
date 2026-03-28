import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { t } from '../i18n/ru'
import { formatMoney } from '../utils/money'

const SECTIONS = ['players', 'game', 'history']

function formatTransactionTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function TransactionItem({ tx }) {
  const getText = () => {
    if (tx.kind === 'deposit') return t.transactionDeposit(tx.toPlayerName, tx.amount)
    if (tx.kind === 'payment') return t.transactionPayment(tx.fromPlayerName, tx.amount)
    if (tx.kind === 'transfer') return t.transactionTransfer(tx.fromPlayerName, tx.toPlayerName, tx.amount)
    return 'Операция'
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2.5">
      <span className="truncate text-xs text-slate-300">{getText()}</span>
      <span className="ml-2 shrink-0 text-[10px] text-slate-500">{formatTransactionTime(tx.timestamp)}</span>
    </div>
  )
}

function SectionTab({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

export function SettingsDialog({
  open,
  onClose,
  onResetPlayers,
  onRemovePlayer,
  startingBalance,
  onSetStartingBalance,
  playersCount,
  players,
  transactions,
  onAddPlayer,
  nfcSupported,
  onScanNfc,
  scanBusy,
  onClearHistory,
}) {
  const [activeSection, setActiveSection] = useState('players')
  const [tempBalance, setTempBalance] = useState(startingBalance)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scannedSerial, setScannedSerial] = useState('')
  const [addError, setAddError] = useState('')

  const handleOpen = () => {
    setTempBalance(startingBalance)
    setNewPlayerName('')
    setScannedSerial('')
    setAddError('')
    setActiveSection('players')
  }

  const handleSaveBalance = () => {
    const value = Math.max(0, Math.floor(Number(tempBalance) || 0))
    onSetStartingBalance(value)
  }

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return
    const result = onAddPlayer(newPlayerName.trim(), scannedSerial)
    if (result.ok) {
      setNewPlayerName('')
      setScannedSerial('')
      setAddError('')
    } else if (result.reason === 'nfc_duplicate') {
      setAddError(`NFC-карта уже привязана к игроку "${result.playerName}"`)
    } else if (result.reason === 'limit') {
      setAddError('Достигнуто максимальное количество игроков')
    } else if (result.reason === 'empty_name') {
      setAddError('Введите имя игрока')
    }
  }

  const handleScanNfc = async () => {
    console.log('SettingsDialog: handleScanNfc called, scanBusy:', scanBusy, 'isScanning:', isScanning)
    if (scanBusy || isScanning) {
      console.log('SettingsDialog: scan already in progress')
      return
    }
    setIsScanning(true)
    try {
      const serial = await onScanNfc()
      console.log('SettingsDialog: NFC serial received:', serial)
      if (serial) setScannedSerial(serial)
    } catch (err) {
      console.error('SettingsDialog: NFC scan error:', err)
    } finally {
      setIsScanning(false)
    }
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

            <div className="flex gap-2 border-b border-slate-800 px-4 py-3">
              <SectionTab
                id="players"
                label={t.sectionPlayers}
                active={activeSection === 'players'}
                onClick={() => setActiveSection('players')}
              />
              <SectionTab
                id="game"
                label={t.sectionGame}
                active={activeSection === 'game'}
                onClick={() => setActiveSection('game')}
              />
              <SectionTab
                id="history"
                label={t.transactionHistory}
                active={activeSection === 'history'}
                onClick={() => setActiveSection('history')}
              />
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-4">
              {activeSection === 'players' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-500/10 p-4 ring-1 ring-amber-500/30">
                    <p className="text-sm font-semibold text-amber-200">{t.addPlayerSection}</p>
                    <p className="mt-1 text-xs text-amber-200/70">{t.addPlayerSectionHint}</p>
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => {
                          setNewPlayerName(e.target.value)
                          setAddError('')
                        }}
                        placeholder={t.addPlayerNamePh}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-600 focus:border-amber-500/50"
                      />
                      {nfcSupported && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setAddError('')
                            handleScanNfc()
                          }}
                          disabled={scanBusy || isScanning}
                          className={`w-full rounded-xl py-2.5 text-sm font-medium ring-1 ${
                            scannedSerial
                              ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 ring-slate-700'
                          }`}
                        >
                          {scannedSerial ? `NFC: ${scannedSerial}` : t.scanNfcForNewPlayer}
                        </motion.button>
                      )}
                      {addError && (
                        <p className="text-xs text-red-400">{addError}</p>
                      )}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddPlayer}
                        disabled={!newPlayerName.trim()}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        + {t.addPlayerSubmit}
                      </motion.button>
                    </div>
                  </div>

                  {playersCount > 0 && (
                    <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-slate-700">
                      <p className="text-sm font-semibold text-slate-300">{t.managePlayers}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.managePlayersHint}</p>
                      <div className="mt-3 flex flex-col gap-2">
                        {players?.map((p) => (
                          <motion.button
                            key={p.id}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onRemovePlayer(p.id)}
                            className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-slate-700 hover:bg-red-900/30 hover:text-red-300"
                          >
                            <div className="flex items-center gap-2">
                              <span className="truncate">{p.name}</span>
                              {p.nfcSerial && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                                  NFC
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{formatMoney(p.balance)}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'game' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-950/80 p-4 ring-1 ring-slate-800">
                    <p className="text-sm font-semibold text-slate-300">{t.startingBalanceLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.startingBalanceHint}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        value={tempBalance}
                        onChange={(e) => setTempBalance(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-base text-white outline-none ring-0 placeholder:text-slate-600 focus:border-amber-500/50"
                        min={0}
                        step={100}
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-emerald-400">{formatMoney(tempBalance)}</p>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveBalance}
                      className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-sm font-semibold text-white"
                    >
                      {t.confirm}
                    </motion.button>
                  </div>

                  {playersCount > 0 && (
                    <div className="rounded-xl bg-red-950/30 p-4 ring-1 ring-red-900/50">
                      <p className="text-sm font-semibold text-red-300">{t.resetBalances}</p>
                      <p className="mt-1 text-xs text-red-400/80">{t.resetBalancesHint}</p>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onResetPlayers()
                        }}
                        className="mt-3 w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white ring-1 ring-red-500/50"
                      >
                        {t.resetCash}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-300">{t.transactionHistory}</p>
                    {transactions && transactions.length > 0 && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={onClearHistory}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        {t.clearHistory}
                      </motion.button>
                    )}
                  </div>
                  <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                    {transactions && transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <TransactionItem key={tx.id} tx={tx} />
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-500">{t.noTransactions}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 px-4 py-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-medium text-slate-200 ring-1 ring-slate-700"
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
