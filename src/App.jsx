import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BankHeader } from './components/BankHeader'
import { DragGhost } from './components/DragGhost'
import { KeypadDialog } from './components/KeypadDialog'
import { PlayerCard } from './components/PlayerCard'
import { QuickNfcDialog } from './components/QuickNfcDialog'
import { SettingsDialog } from './components/SettingsDialog'
import { useDragSession } from './hooks/useDragSession'
import { useGameState } from './hooks/useGameState'
import { useNFC, vibrate } from './hooks/useNFC'
import { t } from './i18n/ru'
import { formatMoney, keypadToAmount } from './utils/money'

function playerName(players, id) {
  return players.find((p) => p.id === id)?.name ?? 'Игрок'
}

export default function App() {
  const {
    state,
    addPlayer,
    applyTransaction,
    canApplyTransaction,
    resetPlayers,
    removePlayer,
    clearHistory,
    maxPlayers,
    setStartingBalance,
  } = useGameState()
  const { supported: nfcSupported, scanning: nfcScanning, readTagOnce, watchSerial } = useNFC()

  const [keypadOpen, setKeypadOpen] = useState(false)
  const [digits, setDigits] = useState('')
  const [nfcHint, setNfcHint] = useState('')
  const [pendingMeta, setPendingMeta] = useState(null)
  const [quickTransferOpen, setQuickTransferOpen] = useState(false)
  const [quickFrom, setQuickFrom] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const pendingRef = useRef(null)
  const keypadOpenRef = useRef(false)
  const quickOpenRef = useRef(false)
  const settingsOpenRef = useRef(false)
  const playersRef = useRef(state.players)
  const nfcHandlerRef = useRef(null)

  useEffect(() => {
    pendingRef.current = pendingMeta
  }, [pendingMeta])
  keypadOpenRef.current = keypadOpen
  quickOpenRef.current = quickTransferOpen
  settingsOpenRef.current = settingsOpen
  playersRef.current = state.players

  const validateHover = useCallback((source, zone) => {
    if (!zone) return { valid: false }
    if (source.type === 'bank') {
      return { valid: zone.kind === 'player' }
    }
    if (source.type === 'player') {
      if (zone.kind === 'bank') return { valid: true }
      if (zone.kind === 'player' && zone.playerId !== source.playerId) return { valid: true }
      return { valid: false }
    }
    return { valid: false }
  }, [])

  const commitDrag = useCallback(
    (source, zone) => {
      const hint = validateHover(source, zone)
      if (!hint.valid || !zone) {
        vibrate([80])
        return
      }

      const players = playersRef.current
      let tx = null
      let title = ''
      let subtitle = ''

      if (source.type === 'bank' && zone.kind === 'player') {
        tx = { kind: 'deposit', toPlayerId: zone.playerId }
        title = t.deposit
        subtitle = t.subtitleBankTo(playerName(players, zone.playerId))
      } else if (source.type === 'player' && zone.kind === 'bank') {
        tx = { kind: 'payment', fromPlayerId: source.playerId }
        title = t.payment
        subtitle = t.subtitleToBank(playerName(players, source.playerId))
      } else if (source.type === 'player' && zone.kind === 'player') {
        tx = {
          kind: 'transfer',
          fromPlayerId: source.playerId,
          toPlayerId: zone.playerId,
        }
        title = t.transfer
        subtitle = t.subtitleTransfer(
          playerName(players, source.playerId),
          playerName(players, zone.playerId),
        )
      }

      if (!tx) {
        vibrate([80])
        return
      }

      setPendingMeta({ tx, title, subtitle })
      setDigits('')
      setNfcHint('')
      setKeypadOpen(true)
    },
    [validateHover],
  )

  const { session, startDrag, ghostMotion, hoverHint } = useDragSession({
    onCommit: commitDrag,
    validateHover,
  })

  // NFC сканирование - запускается один раз при старте
  useEffect(() => {
    if (!nfcSupported) {
      console.log('NFC: not supported')
      return
    }

    const handler = (serial) => {
      console.log('NFC serial received:', serial)
      
      // Не обрабатываем, если открыты настройки
      if (settingsOpenRef.current) {
        console.log('NFC: settings open, skipping')
        return
      }
      
      const players = playersRef.current
      const p = players.find((x) => x.nfcSerial && x.nfcSerial === serial)
      if (!p) {
        console.log('NFC: player not found for serial', serial)
        vibrate([80])
        return
      }

      console.log('NFC: player found', p.name)
      
      // Не обрабатываем, если уже открыто быстрое меню
      if (quickOpenRef.current) {
        console.log('NFC: quick open already active')
        return
      }

      // Если открыт диалог ввода суммы - обновляем получателя
      if (keypadOpenRef.current) {
        const meta = pendingRef.current
        setNfcHint(t.nfcCardHint(p.name))
        if (!meta?.tx) return

        if (meta.tx.kind === 'transfer' && p.id !== meta.tx.fromPlayerId) {
          setPendingMeta({
            ...meta,
            tx: { ...meta.tx, toPlayerId: p.id },
            subtitle: t.subtitleTransfer(
              playerName(players, meta.tx.fromPlayerId),
              p.name,
            ),
          })
        } else if (meta.tx.kind === 'deposit' && meta.tx.toPlayerId !== p.id) {
          setPendingMeta({
            ...meta,
            tx: { ...meta.tx, toPlayerId: p.id },
            subtitle: t.subtitleBankTo(p.name),
          })
        } else if (meta.tx.kind === 'payment' && meta.tx.fromPlayerId !== p.id) {
          setPendingMeta({
            ...meta,
            tx: { ...meta.tx, fromPlayerId: p.id },
            subtitle: t.subtitleToBank(p.name),
          })
        }
        return
      }

      console.log('NFC: opening quick transfer')
      vibrate([40])
      setQuickFrom(p)
      setQuickTransferOpen(true)
    }

    console.log('NFC: starting watch')
    nfcHandlerRef.current = handler
  }, [nfcSupported])

  // Подписка на NFC - запускается один раз
  useEffect(() => {
    if (!nfcSupported || !nfcHandlerRef.current) return

    const cleanup = watchSerial(nfcHandlerRef.current)
    console.log('NFC: watchSerial subscribed')
    
    return () => {
      console.log('NFC: watchSerial cleanup')
      cleanup()
    }
  }, [nfcSupported, watchSerial])

  const openKeypadFromQuick = useCallback((tx, title, subtitle) => {
    setPendingMeta({ tx, title, subtitle })
    setDigits('')
    setNfcHint('')
    setQuickTransferOpen(false)
    setQuickFrom(null)
    setKeypadOpen(true)
  }, [])

  const onBankPointerDown = useCallback(
    (e) => {
      startDrag(e, {
        source: { type: 'bank' },
        label: t.ghostBank,
        sub: t.ghostDeposit,
      })
    },
    [startDrag],
  )

  const onPlayerPointerDown = useCallback(
    (e, p) => {
      startDrag(e, {
        source: { type: 'player', playerId: p.id },
        label: p.name,
        sub: formatMoney(p.balance),
      })
    },
    [startDrag],
  )

  const openSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const amountPreview = useMemo(() => keypadToAmount(digits), [digits])

  const confirmDisabledReason = useMemo(() => {
    if (!pendingMeta?.tx || !digits) return true
    return !canApplyTransaction(pendingMeta.tx, amountPreview)
  }, [pendingMeta, digits, canApplyTransaction, amountPreview])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950">
      <BankHeader
        isDraggingBank={session?.source?.type === 'bank'}
        hoverValidBank={
          !!(
            session?.source?.type === 'player' &&
            hoverHint?.zone?.kind === 'bank' &&
            hoverHint?.valid
          )
        }
        onBankPointerDown={onBankPointerDown}
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 px-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={openSettings}
            className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700"
          >
            ⚙ {t.settings}
          </motion.button>
        </div>

        {state.players.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-10 text-center">
            <p className="text-base font-medium text-slate-300">{t.emptyPlayersTitle}</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">{t.emptyPlayersHint}</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={openSettings}
              className="mt-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-900/20"
            >
              + {t.addPlayer}
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {state.players.map((player) => {
              const isSource =
                session?.source?.type === 'player' && session.source.playerId === player.id

              const overHere =
                hoverHint?.zone?.kind === 'player' && hoverHint.zone.playerId === player.id

              const hoverValidHere = !!(session && overHere && hoverHint?.valid)
              const hoverInvalidHere = !!(session && overHere && hoverHint && hoverHint.valid === false)

              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSource={!!isSource}
                  hoverValidHere={hoverValidHere}
                  hoverInvalidHere={hoverInvalidHere}
                  onPlayerPointerDown={onPlayerPointerDown}
                />
              )
            })}
          </div>
        )}

        {!nfcSupported ? (
          <p className="mt-4 px-1 text-center text-[11px] text-slate-600">{t.nfcUnsupported}</p>
        ) : null}
      </main>

      <DragGhost session={session} ghostMotion={ghostMotion} />

      <QuickNfcDialog
        open={quickTransferOpen}
        fromPlayer={quickFrom}
        players={state.players}
        onClose={() => {
          setQuickTransferOpen(false)
          setQuickFrom(null)
        }}
        onPickBank={() => {
          if (!quickFrom) return
          openKeypadFromQuick(
            { kind: 'payment', fromPlayerId: quickFrom.id },
            t.payment,
            t.subtitleToBank(quickFrom.name),
          )
        }}
        onPickBankDeposit={() => {
          if (!quickFrom) return
          openKeypadFromQuick(
            { kind: 'deposit', toPlayerId: quickFrom.id },
            t.deposit,
            t.subtitleBankTo(quickFrom.name),
          )
        }}
        onPickPlayer={(toId) => {
          if (!quickFrom) return
          const toName = playerName(state.players, toId)
          openKeypadFromQuick(
            { kind: 'transfer', fromPlayerId: quickFrom.id, toPlayerId: toId },
            t.transfer,
            t.subtitleTransfer(quickFrom.name, toName),
          )
        }}
      />

      <KeypadDialog
        open={keypadOpen}
        title={pendingMeta?.title ?? ''}
        subtitle={pendingMeta?.subtitle ?? ''}
        digits={digits}
        onDigitsChange={setDigits}
        nfcActivePlayerName={nfcHint}
        canConfirm={!confirmDisabledReason}
        onCancel={() => {
          setKeypadOpen(false)
          setPendingMeta(null)
          setDigits('')
          setNfcHint('')
        }}
        onConfirm={(amount) => {
          if (!pendingMeta?.tx) return
          const r = applyTransaction(pendingMeta.tx, amount)
          if (!r.ok) vibrate([80])
          else vibrate([40])
          setKeypadOpen(false)
          setPendingMeta(null)
          setDigits('')
          setNfcHint('')
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetPlayers={resetPlayers}
        onRemovePlayer={removePlayer}
        onClearHistory={clearHistory}
        onAddPlayer={addPlayer}
        startingBalance={state.startingBalance}
        onSetStartingBalance={setStartingBalance}
        playersCount={state.players.length}
        players={state.players}
        transactions={state.transactions}
        nfcSupported={nfcSupported}
        onScanNfc={async () => {
          try {
            const result = await readTagOnce()
            return result?.serial || null
          } catch {
            return null
          }
        }}
        scanBusy={nfcScanning}
      />
    </div>
  )
}
