export const DEFAULT_CURRENCY_CODE = 'USD'

export const createCurrencyFormatter = (
  currencyCode: string,
  locale = 'en-US',
): Intl.NumberFormat => {
  const normalizedCode = currencyCode?.trim() ? currencyCode.toUpperCase() : DEFAULT_CURRENCY_CODE
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
