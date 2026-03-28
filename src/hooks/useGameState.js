import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'monopoly-bank-state-v2'
const LEGACY_STORAGE_KEY = 'monopoly-bank-state-v1'
const MAX_PLAYERS = 8
const STARTING_BALANCE = 15_000

function newPlayerId() {
  try {
    const id = globalThis.crypto?.randomUUID?.()
    if (id) return `p-${id}`
  } catch {
    /* ignore */
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizePlayer(p) {
  let balance = 0
  if (typeof p.balanceCents === 'number') balance = Math.floor(p.balanceCents / 100)
  else if (typeof p.balance === 'number') balance = Math.floor(p.balance)
  return {
    id: String(p.id),
    name: String(p.name || 'Игрок'),
    balance: Math.max(0, balance),
    nfcSerial: p.nfcSerial != null ? String(p.nfcSerial) : '',
  }
}

function normalizeBankPool(s) {
  if (typeof s.bankPoolCents === 'number') return Math.max(0, Math.floor(s.bankPoolCents / 100))
  if (typeof s.bankPool === 'number') return Math.max(0, Math.floor(s.bankPool))
  return 500_000
}

function normalizeState(s) {
  const players = Array.isArray(s.players) ? s.players.map(normalizePlayer) : []
  return {
    bankMode: s.bankMode === 'finite' ? 'finite' : 'infinite',
    bankPool: normalizeBankPool(s),
    players,
  }
}

function loadState() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.players)) return null
    return normalizeState(parsed)
  } catch {
    return null
  }
}

/** @returns {{ ok: boolean, state?: object, reason?: string }} */
function tryApplyTransaction(s, tx, amount) {
  const amt = Math.floor(Number(amount) || 0)
  if (amt <= 0) return { ok: false, reason: 'Amount must be positive' }
  const next = { ...s, players: s.players.map((p) => ({ ...p })) }
  const find = (id) => next.players.find((p) => p.id === id)
  const bankOk = (take) => {
    if (next.bankMode === 'infinite') return true
    return next.bankPool >= take
  }

  if (tx.kind === 'deposit') {
    const to = find(tx.toPlayerId)
    if (!to) return { ok: false, reason: 'Player not found' }
    if (!bankOk(amt)) return { ok: false, reason: 'Bank pool too low' }
    if (next.bankMode === 'finite') next.bankPool -= amt
    to.balance += amt
    return { ok: true, state: next }
  }

  if (tx.kind === 'payment') {
    const from = find(tx.fromPlayerId)
    if (!from) return { ok: false, reason: 'Player not found' }
    if (from.balance < amt) return { ok: false, reason: 'Insufficient balance' }
    from.balance -= amt
    if (next.bankMode === 'finite') next.bankPool += amt
    return { ok: true, state: next }
  }

  if (tx.kind === 'transfer') {
    const from = find(tx.fromPlayerId)
    const to = find(tx.toPlayerId)
    if (!from || !to) return { ok: false, reason: 'Player not found' }
    if (from.id === to.id) return { ok: false, reason: 'Same player' }
    if (from.balance < amt) return { ok: false, reason: 'Insufficient balance' }
    from.balance -= amt
    to.balance += amt
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
        bankPool: 500_000,
        players: [],
      }),
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      /* ignore quota */
    }
  }, [state])

  const setBankMode = useCallback((mode) => {
    setState((s) => ({ ...s, bankMode: mode }))
  }, [])

  /** NFC только при создании: серийник снимается один раз в форме добавления. */
  const addPlayer = useCallback((name, nfcSerial = '') => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return { ok: false, reason: 'empty_name' }

    let out = { ok: false, reason: 'unknown' }
    setState((s) => {
      if (s.players.length >= MAX_PLAYERS) {
        out = { ok: false, reason: 'limit' }
        return s
      }
      const serial = String(nfcSerial || '').trim()
      const id = newPlayerId()
      const cleared = s.players.map((p) =>
        serial && p.nfcSerial === serial ? { ...p, nfcSerial: '' } : p,
      )
      out = { ok: true }
      return {
        ...s,
        players: [
          ...cleared,
          {
            id,
            name: trimmed,
            balance: STARTING_BALANCE,
            nfcSerial: serial,
          },
        ],
      }
    })
    return out
  }, [])

  const applyTransaction = useCallback((tx, amount) => {
    let result = { ok: false, reason: 'No update' }
    setState((s) => {
      const r = tryApplyTransaction(s, tx, amount)
      result = r
      return r.ok && r.state ? r.state : s
    })
    return result.ok ? { ok: true } : { ok: false, reason: result.reason }
  }, [])

  const canApplyTransaction = useCallback(
    (tx, amount) => tryApplyTransaction(state, tx, amount).ok,
    [state],
  )

  const resetPlayers = useCallback(() => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => ({ ...p, balance: STARTING_BALANCE })),
    }))
  }, [])

  return {
    state,
    setState,
    setBankMode,
    addPlayer,
    applyTransaction,
    canApplyTransaction,
    resetPlayers,
    maxPlayers: MAX_PLAYERS,
    startingBalance: STARTING_BALANCE,
  }
}
