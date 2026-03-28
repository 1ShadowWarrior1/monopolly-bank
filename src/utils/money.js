/** Формат: целые «доллары» Монополии, без копеек. @param {number} amount */
export function formatMoney(amount) {
  const neg = amount < 0
  const v = Math.abs(Math.trunc(amount))
  const s = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v)
  return neg ? `−$${s}` : `$${s}`
}

/** Ввод с клавиатуры — только целое число (строка цифр → int). */
export function keypadToAmount(keypadDigits) {
  if (!keypadDigits) return 0
  const n = parseInt(keypadDigits, 10)
  return Number.isFinite(n) ? n : 0
}
