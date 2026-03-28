/** @param {number} cents */
export function formatMoney(cents) {
  const neg = cents < 0
  const v = Math.abs(cents)
  const dollars = Math.floor(v / 100)
  const cc = v % 100
  const s = `${dollars.toLocaleString()}.${cc.toString().padStart(2, '0')}`
  return neg ? `−$${s}` : `$${s}`
}

/** Parse keypad string (e.g. "1234" = $12.34) to cents */
export function keypadToCents(keypadDigits) {
  if (!keypadDigits) return 0
  return parseInt(keypadDigits, 10)
}
