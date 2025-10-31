import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Product } from '../../types'
import { Button } from '../../components/ui'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/Products(${id})`)
      return response.data as Product
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Products(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading product...</div>
  }

  if (error || !product) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading product
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const margin = product.Price - product.Cost
  const marginPercent = product.Price > 0 ? ((margin / product.Price) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {product.Name}
            </h1>
            {!product.IsActive && (
              <span className="badge badge-secondary">Inactive</span>
            )}
          </div>
          {product.Category && (
            <span className="badge badge-primary mt-2">{product.Category}</span>
          )}
        </div>
        <div className="flex gap-3">
          <Link to={`/products/${id}/edit`} className="btn btn-primary">
            Edit Product
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Product details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Product Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.SKU && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">SKU</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{product.SKU}</dd>
            </>
          )}
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            ${product.Price.toFixed(2)}
          </dd>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            ${product.Cost.toFixed(2)}
          </dd>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Margin</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            ${margin.toFixed(2)} ({marginPercent}%)
          </dd>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            {product.Stock} units
          </dd>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            {product.IsActive ? 'Active' : 'Inactive'}
          </dd>
          {product.Description && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Description</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2">{product.Description}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{product.Name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm mt-4">
                Error: {(deleteMutation.error as Error).message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
