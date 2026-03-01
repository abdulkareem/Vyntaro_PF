export function resolveCurrencyCode() {
  const locale = navigator.language.toLowerCase()
  return locale.includes('in') ? 'INR' : 'USD'
}

export function formatCurrency(value: number, currencyCode = resolveCurrencyCode()) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatCompactCurrency(value: number, currencyCode = resolveCurrencyCode()) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}
