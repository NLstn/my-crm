import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import api from '../lib/api'
import { createCurrencyFormatter, DEFAULT_CURRENCY_CODE } from '../lib/currency'

type OrganizationSetting = {
  ID: number
  DefaultCurrencyCode: string
}

type FetchSettingsFn = () => Promise<OrganizationSetting | null>

const CurrencyContext = createContext<{
  currencyCode: string
  formatter: Intl.NumberFormat
  formatCurrency: (value: number, currencyOverride?: string, localeOverride?: string) => string
} | undefined>(undefined)

const defaultFetchSettings: FetchSettingsFn = async () => {
  const response = await api.get('/OrganizationSettings?$top=1')
  const data = response.data as { items?: OrganizationSetting[] } | OrganizationSetting | null | undefined

  if (data && 'items' in (data as Record<string, unknown>)) {
    const items = (data as { items?: OrganizationSetting[] }).items
    if (items && items.length > 0) {
      return items[0]
    }
  }

  if (data && typeof data === 'object' && 'DefaultCurrencyCode' in data) {
    return data as OrganizationSetting
  }

  return null
}

type CurrencyProviderProps = {
  children: ReactNode
  fetchSettings?: FetchSettingsFn
}

export function CurrencyProvider({ children, fetchSettings }: CurrencyProviderProps) {
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY_CODE)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const loader = fetchSettings ?? defaultFetchSettings
        const settings = await loader()
        if (!active) return
        if (settings?.DefaultCurrencyCode) {
          setCurrencyCode(settings.DefaultCurrencyCode.trim().toUpperCase())
        }
      } catch (error) {
        console.error('Failed to load organization currency settings', error)
        if (!active) return
        setCurrencyCode(DEFAULT_CURRENCY_CODE)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [fetchSettings])

  const formatter = useMemo(() => createCurrencyFormatter(currencyCode), [currencyCode])

  const formatCurrency = useCallback(
    (value: number, currencyOverride?: string, localeOverride = 'en-US') => {
      const normalizedCode = currencyOverride?.trim() ? currencyOverride.toUpperCase() : currencyCode
      if (normalizedCode === currencyCode && localeOverride === 'en-US') {
        return formatter.format(value)
      }
      return createCurrencyFormatter(normalizedCode, localeOverride).format(value)
    },
    [currencyCode, formatter],
  )

  const contextValue = useMemo(
    () => ({
      currencyCode,
      formatter,
      formatCurrency,
    }),
    [currencyCode, formatter, formatCurrency],
  )

  return <CurrencyContext.Provider value={contextValue}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
