import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BankHeader } from './components/BankHeader'
import { DragGhost } from './components/DragGhost'
import { KeypadDialog } from './components/KeypadDialog'
import { PlayerCard } from './components/PlayerCard'
import { useDragSession } from './hooks/useDragSession'
import { useGameState } from './hooks/useGameState'
import { useNFC, vibrate } from './hooks/useNFC'
import { formatMoney, keypadToCents } from './utils/money'

function playerName(players, id) {
  return players.find((p) => p.id === id)?.name ?? 'Player'
}

export default function App() {
  const { state, setBankMode, bindNfc, applyTransaction, canApplyTransaction, resetPlayers } =
    useGameState()
  const { supported: nfcSupported, scanning: nfcScanning, readTagOnce, watchSerial } = useNFC()

  const [keypadOpen, setKeypadOpen] = useState(false)
  const [digits, setDigits] = useState('')
  const [nfcHint, setNfcHint] = useState('')
  const [pendingMeta, setPendingMeta] = useState(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    pendingRef.current = pendingMeta
  }, [pendingMeta])

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

      let tx = null
      let title = ''
      let subtitle = ''

      if (source.type === 'bank' && zone.kind === 'player') {
        tx = { kind: 'deposit', toPlayerId: zone.playerId }
        title = 'Deposit'
        subtitle = `Bank → ${playerName(state.players, zone.playerId)}`
      } else if (source.type === 'player' && zone.kind === 'bank') {
        tx = { kind: 'payment', fromPlayerId: source.playerId }
        title = 'Payment / tax'
        subtitle = `${playerName(state.players, source.playerId)} → Bank`
      } else if (source.type === 'player' && zone.kind === 'player') {
        tx = {
          kind: 'transfer',
          fromPlayerId: source.playerId,
          toPlayerId: zone.playerId,
        }
        title = 'Transfer'
        subtitle = `${playerName(state.players, source.playerId)} → ${playerName(state.players, zone.playerId)}`
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
    [state.players, validateHover],
  )

  const { session, startDrag, ghostMotion, hoverHint } = useDragSession({
    onCommit: commitDrag,
    validateHover,
  })

  useEffect(() => {
    if (!keypadOpen || !nfcSupported) return
    return watchSerial((serial) => {
      const players = state.players
      const p = players.find((x) => x.nfcSerial && x.nfcSerial === serial)
      setNfcHint(p?.name ?? 'Unknown card')
      const meta = pendingRef.current
      if (!meta?.tx || !p) return

      if (meta.tx.kind === 'transfer' && p.id !== meta.tx.fromPlayerId) {
        setPendingMeta({
          ...meta,
          tx: { ...meta.tx, toPlayerId: p.id },
          subtitle: `${playerName(players, meta.tx.fromPlayerId)} → ${p.name}`,
        })
      } else if (meta.tx.kind === 'deposit' && meta.tx.toPlayerId !== p.id) {
        setPendingMeta({
          ...meta,
          tx: { ...meta.tx, toPlayerId: p.id },
          subtitle: `Bank → ${p.name}`,
        })
      } else if (meta.tx.kind === 'payment' && meta.tx.fromPlayerId !== p.id) {
        setPendingMeta({
          ...meta,
          tx: { ...meta.tx, fromPlayerId: p.id },
          subtitle: `${p.name} → Bank`,
        })
      }
    })
  }, [keypadOpen, nfcSupported, watchSerial, state.players])

  const onBankPointerDown = useCallback(
    (e) => {
      startDrag(e, {
        source: { type: 'bank' },
        label: 'Bank',
        sub: 'Deposit',
      })
    },
    [startDrag],
  )

  const onPlayerPointerDown = useCallback(
    (e, p) => {
      startDrag(e, {
        source: { type: 'player', playerId: p.id },
        label: p.name,
        sub: formatMoney(p.balanceCents),
      })
    },
    [startDrag],
  )

  const toggleBankMode = useCallback(() => {
    setBankMode(state.bankMode === 'infinite' ? 'finite' : 'infinite')
  }, [setBankMode, state.bankMode])

  const centsPreview = useMemo(() => keypadToCents(digits), [digits])

  const confirmDisabledReason = useMemo(() => {
    if (!pendingMeta?.tx || !digits) return true
    return !canApplyTransaction(pendingMeta.tx, centsPreview)
  }, [pendingMeta, digits, canApplyTransaction, centsPreview])

  const bindPlayerNfc = async (playerId) => {
    try {
      const serial = await readTagOnce()
      bindNfc(playerId, serial)
    } catch {
      vibrate([80])
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950">
      <BankHeader
        bankMode={state.bankMode}
        bankPoolCents={state.bankPoolCents}
        onToggleMode={toggleBankMode}
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
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Players</p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={resetPlayers}
            className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700"
          >
            Reset cash
          </motion.button>
        </div>

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
                onBindNfc={bindPlayerNfc}
                nfcBusy={nfcScanning}
                nfcSupported={nfcSupported}
              />
            )
          })}
        </div>

        {!nfcSupported ? (
          <p className="mt-4 px-1 text-center text-[11px] text-slate-600">
            Web NFC needs a supported browser (e.g. Chrome on Android).
          </p>
        ) : null}
      </main>

      <DragGhost session={session} ghostMotion={ghostMotion} />

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
        onConfirm={(cents) => {
          if (!pendingMeta?.tx) return
          const r = applyTransaction(pendingMeta.tx, cents)
          if (!r.ok) vibrate([80])
          else vibrate([40])
          setKeypadOpen(false)
          setPendingMeta(null)
          setDigits('')
          setNfcHint('')
        }}
      />
    </div>
  )
}
