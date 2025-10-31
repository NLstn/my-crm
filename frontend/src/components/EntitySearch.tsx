import { useState, useEffect } from 'react'
import { Input } from './ui/Input'

export interface SortOption {
  label: string
  value: string
}

export interface FilterOption {
  label: string
  key: string
  type: 'select' | 'text'
  options?: { label: string; value: string }[]
}

export interface EntitySearchProps {
  searchPlaceholder?: string
  sortOptions?: SortOption[]
  filterOptions?: FilterOption[]
  onQueryChange: (query: string) => void
  totalCount?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

/**
 * EntitySearch - A reusable search component for entity lists
 * 
 * Provides consistent search, filtering, sorting, and pagination UI
 * across all entity list pages. Generates OData query parameters.
 * 
 * @example
 * ```tsx
 * <EntitySearch
 *   searchPlaceholder="Search accounts..."
 *   sortOptions={[
 *     { label: 'Name (A-Z)', value: 'Name asc' },
 *     { label: 'Name (Z-A)', value: 'Name desc' },
 *   ]}
 *   onQueryChange={setODataQuery}
 *   totalCount={100}
 * />
 * ```
 */
export default function EntitySearch({
  searchPlaceholder = 'Search...',
  sortOptions = [],
  filterOptions = [],
  onQueryChange,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}: EntitySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || '')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Build OData query string
  useEffect(() => {
    const params: string[] = []

    // Add search parameter
    if (debouncedSearchTerm) {
      params.push(`$search=${encodeURIComponent(debouncedSearchTerm)}`)
    }

    // Add sort parameter
    if (sortBy) {
      params.push(`$orderby=${encodeURIComponent(sortBy)}`)
    }

    // Add filter parameters
    const filterConditions: string[] = []
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        // Handle different filter types
        const filterOption = filterOptions.find(f => f.key === key)
        if (filterOption?.type === 'select') {
          filterConditions.push(`${key} eq '${value}'`)
        } else {
          filterConditions.push(`contains(${key}, '${value}')`)
        }
      }
    })
    if (filterConditions.length > 0) {
      params.push(`$filter=${encodeURIComponent(filterConditions.join(' and '))}`)
    }

    // Add pagination
    params.push(`$top=${pageSize}`)
    params.push(`$skip=${(currentPage - 1) * pageSize}`)
    params.push('$count=true')

    onQueryChange(params.length > 0 ? '?' + params.join('&') : '')
  }, [debouncedSearchTerm, sortBy, filters, currentPage, pageSize, filterOptions, onQueryChange])

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <div className="w-full md:w-64">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Row */}
      {filterOptions.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {filterOptions.map((filter) => (
            <div key={filter.key} className="w-full md:w-64">
              {filter.type === 'select' && filter.options ? (
                <select
                  value={filters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="input"
                >
                  <option value="">{filter.label} (All)</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  placeholder={filter.label}
                  value={filters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} -{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>

          <div className="flex items-center gap-2">
            {/* Page Size Selector */}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="input py-1.5 text-sm"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            )}

            {/* Page Navigation */}
            {onPageChange && totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary py-1.5 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary py-1.5 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
