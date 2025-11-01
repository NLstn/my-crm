import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Product } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'
import { useCurrency } from '../../contexts/CurrencyContext'

export default function ProductsList() {
  const { currencyCode, formatCurrency } = useCurrency()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Merge search query
  const odataQuery = mergeODataQuery(searchQuery, {})

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Products${odataQuery}`)
      return response.data
    },
  })

  const products = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
        </div>
        <Link to="/products/new" className="btn btn-primary">
          Create Product
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search products..."
        sortOptions={[
          { label: 'Name (A-Z)', value: 'Name asc' },
          { label: 'Name (Z-A)', value: 'Name desc' },
          { label: 'Price (Low to High)', value: 'Price asc' },
          { label: 'Price (High to Low)', value: 'Price desc' },
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
        ]}
        filterOptions={[
          {
            label: 'Category',
            key: 'Category',
            type: 'text',
          },
        ]}
        onQueryChange={setSearchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading products...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading products: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {products.map((product: Product) => (
              <Link
                key={product.ID}
                to={`/products/${product.ID}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {product.Name}
                      </h3>
                      {!product.IsActive && (
                        <span className="badge badge-secondary">Inactive</span>
                      )}
                    </div>
                    {product.Category && (
                      <span className="badge badge-primary mt-2">{product.Category}</span>
                    )}
                    {product.SKU && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        SKU: {product.SKU}
                      </div>
                    )}
                    {product.Description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {product.Description}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.Price, product.CurrencyCode || currencyCode)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Stock: {product.Stock}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {products.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No products found</p>
              <Link to="/products/new" className="btn btn-primary mt-4 inline-block">
                Create your first product
              </Link>
            </div>
          )}

          {/* Pagination Controls Below Results */}
          <PaginationControls
            totalCount={data?.count || 0}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
