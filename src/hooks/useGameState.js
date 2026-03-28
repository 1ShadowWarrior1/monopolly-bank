import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'monopoly-bank-state-v1'

const DEFAULT_PLAYERS = () =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    balanceCents: 1_500_000,
    nfcSerial: '',
  }))

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.players?.length) return null
    return normalizeState(parsed)
  } catch {
    return null
  }
}

function normalizeState(s) {
  return {
    bankMode: s.bankMode === 'finite' ? 'finite' : 'infinite',
    bankPoolCents: Number.isFinite(s.bankPoolCents) ? Math.max(0, Math.floor(s.bankPoolCents)) : 50_000_000,
    players: s.players.map((p) => ({
      id: String(p.id),
      name: String(p.name || 'Player'),
      balanceCents: Math.floor(Number(p.balanceCents) || 0),
      nfcSerial: p.nfcSerial != null ? String(p.nfcSerial) : '',
    })),
  }
}

/** @returns {{ ok: boolean, state?: object, reason?: string }} */
function tryApplyTransaction(s, tx, amountCents) {
  if (amountCents <= 0) return { ok: false, reason: 'Amount must be positive' }
  const next = { ...s, players: s.players.map((p) => ({ ...p })) }
  const find = (id) => next.players.find((p) => p.id === id)
  const bankOk = (take) => {
    if (next.bankMode === 'infinite') return true
    return next.bankPoolCents >= take
  }

  if (tx.kind === 'deposit') {
    const to = find(tx.toPlayerId)
    if (!to) return { ok: false, reason: 'Player not found' }
    if (!bankOk(amountCents)) return { ok: false, reason: 'Bank pool too low' }
    if (next.bankMode === 'finite') next.bankPoolCents -= amountCents
    to.balanceCents += amountCents
    return { ok: true, state: next }
  }

  if (tx.kind === 'payment') {
    const from = find(tx.fromPlayerId)
    if (!from) return { ok: false, reason: 'Player not found' }
    if (from.balanceCents < amountCents) return { ok: false, reason: 'Insufficient balance' }
    from.balanceCents -= amountCents
    if (next.bankMode === 'finite') next.bankPoolCents += amountCents
    return { ok: true, state: next }
  }

  if (tx.kind === 'transfer') {
    const from = find(tx.fromPlayerId)
    const to = find(tx.toPlayerId)
    if (!from || !to) return { ok: false, reason: 'Player not found' }
    if (from.id === to.id) return { ok: false, reason: 'Same player' }
    if (from.balanceCents < amountCents) return { ok: false, reason: 'Insufficient balance' }
    from.balanceCents -= amountCents
    to.balanceCents += amountCents
    return { ok: true, state: next }
  }

  return { ok: false, reason: 'Unknown transaction' }
}

export function useGameState() {
  const [state, setState] = useState(
    () =>
      loadState() ??
      normalizeState({
        bankMode: 'infinite',
        bankPoolCents: 50_000_000,
        players: DEFAULT_PLAYERS(),
      }),
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota */
    }
  }, [state])

  const setBankMode = useCallback((mode) => {
    setState((s) => ({ ...s, bankMode: mode }))
  }, [])

  const bindNfc = useCallback((playerId, serial) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, nfcSerial: serial }
          : { ...p, nfcSerial: p.nfcSerial === serial ? '' : p.nfcSerial },
      ),
    }))
  }, [])

  const applyTransaction = useCallback((tx, amountCents) => {
    let result = { ok: false, reason: 'No update' }
    setState((s) => {
      const r = tryApplyTransaction(s, tx, amountCents)
      result = r
      return r.ok && r.state ? r.state : s
    })
    return result.ok ? { ok: true } : { ok: false, reason: result.reason }
  }, [])

  const canApplyTransaction = useCallback(
    (tx, amountCents) => tryApplyTransaction(state, tx, amountCents).ok,
    [state],
  )

  const resetPlayers = useCallback(() => {
    setState((s) => ({
      ...s,
      players: DEFAULT_PLAYERS(),
    }))
  }, [])

  return {
    state,
    setState,
    setBankMode,
    bindNfc,
    applyTransaction,
    canApplyTransaction,
    resetPlayers,
  }
}
