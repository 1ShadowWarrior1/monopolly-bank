/** @param {number} cents */
export function formatMoney(cents) {
  const neg = cents < 0
  const v = Math.abs(cents)
  const amount = v / 100
  const s = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return neg ? `−$${s}` : `$${s}`
}

/** Parse keypad string (cents as integer digits) */
export function keypadToCents(keypadDigits) {
  if (!keypadDigits) return 0
  return parseInt(keypadDigits, 10)
}
