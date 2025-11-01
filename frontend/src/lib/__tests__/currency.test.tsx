import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createCurrencyFormatter, DEFAULT_CURRENCY_CODE } from '../currency'
import { CurrencyProvider } from '../../contexts/CurrencyContext'
import { useCurrency } from '../../hooks/useCurrency'
import type { ReactNode } from 'react'

describe('createCurrencyFormatter', () => {
  it('formats values using the provided currency code', () => {
    const formatter = createCurrencyFormatter('EUR')
    expect(formatter.format(1234.56)).toContain('€')
  })

  it('falls back to the default currency when no code is provided', () => {
    const formatter = createCurrencyFormatter('')
    expect(formatter.format(50)).toContain('$')
    const defaultFormatter = createCurrencyFormatter(DEFAULT_CURRENCY_CODE)
    expect(defaultFormatter.format(75)).toContain('$')
  })
})

function TestConsumer() {
  const { currencyCode, formatCurrency } = useCurrency()
  return (
    <div>
      <span data-testid="currency-code">{currencyCode}</span>
      <span data-testid="formatted-value">{formatCurrency(99.99)}</span>
      <span data-testid="override-value">{formatCurrency(99.99, 'GBP')}</span>
    </div>
  )
}

describe('CurrencyProvider', () => {
  it('uses backend currency settings and formats values accordingly', async () => {
    const fetchSettings = vi.fn().mockResolvedValue({
      ID: 1,
      DefaultCurrencyCode: 'EUR',
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CurrencyProvider fetchSettings={fetchSettings}>{children}</CurrencyProvider>
    )

    render(<TestConsumer />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('currency-code').textContent).toBe('EUR')
    })

    expect(screen.getByTestId('formatted-value').textContent).toContain('€')
    expect(screen.getByTestId('override-value').textContent).toContain('£')
  })
})
