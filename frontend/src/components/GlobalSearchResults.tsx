import { Link } from 'react-router-dom'
import type { GlobalSearchResult, GlobalSearchSection } from './searchTypes'

const ENTITY_ORDER: Record<string, number> = {
  Account: 0,
  Contact: 1,
  Lead: 2,
  Opportunity: 3,
}

interface GlobalSearchResultsProps {
  query: string
  isLoading: boolean
  results: GlobalSearchResult[]
  onSelect: (result: GlobalSearchResult) => void
}

function buildSections(results: GlobalSearchResult[]): GlobalSearchSection[] {
  const grouped = new Map<string, GlobalSearchResult[]>()

  for (const result of results) {
    const key = result.entityType
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(result)
  }

  const sections: GlobalSearchSection[] = []
  for (const [title, items] of grouped.entries()) {
    sections.push({
      title,
      items,
    })
  }

  sections.sort((a, b) => {
    const orderA = ENTITY_ORDER[a.title] ?? Number.POSITIVE_INFINITY
    const orderB = ENTITY_ORDER[b.title] ?? Number.POSITIVE_INFINITY
    if (orderA === orderB) {
      return a.title.localeCompare(b.title)
    }
    return orderA - orderB
  })

  return sections
}

export function GlobalSearchResults({ query, isLoading, results, onSelect }: GlobalSearchResultsProps) {
  if (!query) {
    return null
  }

  const sections = buildSections(results)

  return (
    <div
      className="absolute left-0 right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
      role="listbox"
    >
      {isLoading ? (
        <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400">Searching…</div>
      ) : sections.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400">
          No matches for "{query}"
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.title} className="py-3">
            <div className="px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {section.title}
            </div>
            <ul className="mt-2 space-y-1 px-2">
              {section.items.map((item) => (
                <li key={`${item.entityType}-${item.entityId}`}>
                  <Link
                    to={item.path}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault()
                      onSelect(item)
                    }}
                    className="block rounded-md px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-700 focus:bg-gray-100 focus:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-primary-300 dark:focus:bg-gray-800 dark:focus:text-primary-300"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Go to {item.entityType}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
