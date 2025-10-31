import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Product } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/Products(${id})`)
      return response.data as Product
    },
    enabled: isEdit,
  })

  const getInitialFormData = (): Partial<Product> => {
    if (product) {
      return {
        Name: product.Name || '',
        SKU: product.SKU || '',
        Category: product.Category || '',
        Description: product.Description || '',
        Price: product.Price || 0,
        Cost: product.Cost || 0,
        Stock: product.Stock || 0,
        IsActive: product.IsActive !== undefined ? product.IsActive : true,
      }
    }
    return {
      Name: '',
      SKU: '',
      Category: '',
      Description: '',
      Price: 0,
      Cost: 0,
      Stock: 0,
      IsActive: true,
    }
  }

  const [formData, setFormData] = useState<Partial<Product>>(getInitialFormData())

  // Reset form data when product ID changes
  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Product>) => {
      if (isEdit) {
        return api.patch(`/Products(${id})`, data)
      } else {
        return api.post('/Products', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['product', id] })
      }
      navigate(isEdit ? `/products/${id}` : '/products')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Product' : 'Create Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Product Name"
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="SKU"
              type="text"
              name="SKU"
              value={formData.SKU}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Category"
              type="text"
              name="Category"
              value={formData.Category}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Price"
              type="number"
              name="Price"
              value={formData.Price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <Input
              label="Cost"
              type="number"
              name="Cost"
              value={formData.Cost}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <Input
              label="Stock"
              type="number"
              name="Stock"
              value={formData.Stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="IsActive"
                checked={formData.IsActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Active
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Description"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>

        {mutation.isError && (
          <div className="text-error-600 dark:text-error-400 text-sm">
            Error: {(mutation.error as Error).message}
          </div>
        )}
      </form>
    </div>
  )
}
