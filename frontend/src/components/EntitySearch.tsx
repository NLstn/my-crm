import { useState, useEffect, useRef } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

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

export interface PaginationControlsProps {
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

/**
 * PaginationControls - Reusable pagination component
 * 
 * Provides consistent pagination UI with Previous/Next buttons,
 * page count, and page size selector. Should be placed below result tables.
 * 
 * @example
 * ```tsx
 * <PaginationControls
 *   totalCount={totalCount}
 *   currentPage={currentPage}
 *   pageSize={pageSize}
 *   onPageChange={setCurrentPage}
 *   onPageSizeChange={setPageSize}
 * />
 * ```
 */
export function PaginationControls({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
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
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="py-1.5 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[100px] justify-center whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="secondary"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="py-1.5 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * EntitySearch - A reusable search component for entity lists
 * 
 * Provides consistent search, filtering, and sorting UI
 * across all entity list pages. Generates OData query parameters.
 * 
 * Note: Pagination controls are now separate. Use PaginationControls component
 * below your results table.
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
  currentPage = 1,
  pageSize = 10,
  onPageChange,
}: EntitySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || '')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const prevSearchRef = useRef(debouncedSearchTerm)
  const prevFiltersRef = useRef(filters)
  const prevSortRef = useRef(sortBy)

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
        // Escape single quotes in values to prevent injection
        const escapedValue = value.replace(/'/g, "''")
        // Handle different filter types
        const filterOption = filterOptions.find(f => f.key === key)
        if (filterOption?.type === 'select') {
          filterConditions.push(`${key} eq '${escapedValue}'`)
        } else {
          filterConditions.push(`contains(${key}, '${escapedValue}')`)
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

  // Reset to page 1 when search or filters change
  useEffect(() => {
    const searchChanged = prevSearchRef.current !== debouncedSearchTerm
    const sortChanged = prevSortRef.current !== sortBy
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters)
    
    if ((searchChanged || sortChanged || filtersChanged) && onPageChange && currentPage !== 1) {
      onPageChange(1)
    }
    
    prevSearchRef.current = debouncedSearchTerm
    prevSortRef.current = sortBy
    prevFiltersRef.current = filters
  }, [debouncedSearchTerm, sortBy, filters, onPageChange, currentPage])

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
              aria-label={searchPlaceholder}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
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

    </div>
  )
}
