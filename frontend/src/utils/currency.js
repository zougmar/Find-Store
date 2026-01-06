// Currency formatting helper
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00 MAD'
  }
  return `${Number(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} MAD`
}

export const formatCurrencyShort = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 MAD'
  }
  return `${Number(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })} MAD`
}

