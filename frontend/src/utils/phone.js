export function normalizeMoroccanPhone(input) {
  if (input == null) return null

  let value = String(input).trim().replace(/[\s().-]/g, '')
  if (!value) return null

  if (value.startsWith('00')) {
    value = `+${value.slice(2)}`
  }

  if (value.startsWith('+212')) {
    value = `0${value.slice(4)}`
  } else if (value.startsWith('212') && value.length === 12) {
    value = `0${value.slice(3)}`
  }

  if (!/^0[5-7]\d{8}$/.test(value)) {
    return null
  }

  return value
}

export function isValidMoroccanPhone(input) {
  return normalizeMoroccanPhone(input) !== null
}
