import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import {
  Opportunity,
  OpportunityLineItem,
  Account,
  Contact,
  Employee,
  Product,
  OPPORTUNITY_STAGES,
} from '../../types'
import { Button, Input, Textarea } from '../../components/ui'
import { useCurrency } from '../../contexts/CurrencyContext'

const CLOSED_WON_STAGE = 6
const CLOSED_LOST_STAGE = 7

const isClosedStageValue = (value?: number) => value === CLOSED_WON_STAGE || value === CLOSED_LOST_STAGE

const formatDateForInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().split('T')[0]
}

type LineItemFormState = {
  tempId: string
  ID?: number
  ProductID?: number
  ProductName?: string
  Quantity: number
  UnitPrice: number
  DiscountAmount: number
  DiscountPercent: number
  CurrencyCode?: string
}

const createTempId = () => `li-${Math.random().toString(36).slice(2)}-${Date.now()}`

const createEmptyLineItem = (currencyCode?: string): LineItemFormState => ({
  tempId: createTempId(),
  Quantity: 1,
  UnitPrice: 0,
  DiscountAmount: 0,
  DiscountPercent: 0,
  CurrencyCode: currencyCode,
})

const mapOpportunityLineItemToFormState = (item: OpportunityLineItem): LineItemFormState => ({
  tempId: createTempId(),
  ID: item.ID,
  ProductID: item.ProductID,
  ProductName: item.Product?.Name,
  Quantity: item.Quantity,
  UnitPrice: item.UnitPrice,
  DiscountAmount: item.DiscountAmount,
  DiscountPercent: item.DiscountPercent,
  CurrencyCode: item.CurrencyCode,
})

const calculateLineItemTotals = (item: LineItemFormState) => {
  const quantity = item.Quantity > 0 ? item.Quantity : 1
  const subtotal = quantity * item.UnitPrice
  const percentDiscount = subtotal * (item.DiscountPercent / 100)
  const totalDiscount = Math.min(subtotal, Math.max(0, item.DiscountAmount + percentDiscount))
  const total = Math.max(0, subtotal - totalDiscount)

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export default function OpportunityForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currencyCode, formatCurrency } = useCurrency()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')
  const contactIdFromQuery = searchParams.get('contactId')

  const stageOptions = OPPORTUNITY_STAGES()
  const defaultStage = stageOptions[0]?.value ?? 1

  const { data: opportunity } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const response = await api.get(`/Opportunities(${id})?$expand=LineItems($expand=Product)`)
      return response.data as Opportunity
    },
    enabled: isEdit,
  })

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/Accounts')
      return response.data
    },
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees')
      return response.data
    },
  })

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/Products')
      return response.data
    },
  })

  const getInitialFormData = (): Partial<Opportunity> => {
    if (opportunity) {
      return {
        AccountID: opportunity.AccountID,
        ContactID: opportunity.ContactID,
        OwnerEmployeeID: opportunity.OwnerEmployeeID,
        Name: opportunity.Name,
        Amount: opportunity.Amount,
        CurrencyCode: opportunity.CurrencyCode,
        Probability: opportunity.Probability,
        ExpectedCloseDate: opportunity.ExpectedCloseDate,
        Stage: opportunity.Stage,
        Description: opportunity.Description || '',
        CloseReason: opportunity.CloseReason || '',
        ClosedAt: opportunity.ClosedAt,
        ClosedByEmployeeID: opportunity.ClosedByEmployeeID,
      }
    }

    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery, 10) : 0,
      ContactID: contactIdFromQuery ? parseInt(contactIdFromQuery, 10) : undefined,
      OwnerEmployeeID: undefined,
      Name: '',
      Amount: 0,
      CurrencyCode: currencyCode,
      Probability: 50,
      ExpectedCloseDate: undefined,
      Stage: defaultStage,
      Description: '',
      ClosedAt: undefined,
      CloseReason: '',
      ClosedByEmployeeID: undefined,
    }
  }

  const [formData, setFormData] = useState<Partial<Opportunity>>(getInitialFormData())
  const [lineItems, setLineItems] = useState<LineItemFormState[]>(() =>
    isEdit ? [] : [createEmptyLineItem(currencyCode)],
  )
  const [lineItemError, setLineItemError] = useState<string | null>(null)

  const selectedAccountId = formData.AccountID

  const { subtotal: lineItemsSubtotal, total: lineItemsTotal } = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const { subtotal, total } = calculateLineItemTotals(item)
        return {
          subtotal: acc.subtotal + subtotal,
          total: acc.total + total,
        }
      },
      { subtotal: 0, total: 0 },
    )
  }, [lineItems])

  const totalDiscount = Math.max(0, lineItemsSubtotal - lineItemsTotal)
  const resolvedCurrency = formData.CurrencyCode || currencyCode

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', selectedAccountId],
    queryFn: async () => {
      const response = await api.get('/Contacts', {
        params: {
          $filter: `AccountID eq ${selectedAccountId}`,
        },
      })
      return response.data
    },
    enabled: Boolean(selectedAccountId),
  })

  useEffect(() => {
    setFormData(getInitialFormData())
  }, [id, opportunity?.ID, currencyCode])

  useEffect(() => {
    if (isEdit && opportunity) {
      if (opportunity.LineItems && opportunity.LineItems.length > 0) {
        setLineItems(opportunity.LineItems.map(mapOpportunityLineItemToFormState))
      } else {
        setLineItems([createEmptyLineItem(formData.CurrencyCode || currencyCode)])
      }
    } else if (!isEdit) {
      setLineItems([createEmptyLineItem(formData.CurrencyCode || currencyCode)])
    }

    setLineItemError(null)
  }, [isEdit, opportunity?.ID, opportunity?.UpdatedAt, currencyCode, formData.CurrencyCode])

  useEffect(() => {
    if (!selectedAccountId && formData.ContactID) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [selectedAccountId, formData.ContactID])

  useEffect(() => {
    if (!formData.ContactID) return

    const accountContacts = contactsData?.items as Contact[] | undefined
    if (!accountContacts) return

    const contactMatchesAccount = accountContacts.some(contact => contact.ID === formData.ContactID)

    if (!contactMatchesAccount) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [contactsData, formData.ContactID])

  // Handle closed stage logic
  useEffect(() => {
    if (!isClosedStageValue(formData.Stage)) {
      if (formData.ClosedAt || (formData.CloseReason && formData.CloseReason.trim() !== '') || formData.ClosedByEmployeeID) {
        setFormData(prev => ({
          ...prev,
          ClosedAt: undefined,
          CloseReason: '',
          ClosedByEmployeeID: undefined,
        }))
      }
      return
    }

    if (!formData.ClosedByEmployeeID && formData.OwnerEmployeeID) {
      setFormData(prev => ({
        ...prev,
        ClosedByEmployeeID: prev.ClosedByEmployeeID ?? prev.OwnerEmployeeID,
      }))
    }
  }, [formData.Stage, formData.ClosedAt, formData.CloseReason, formData.ClosedByEmployeeID, formData.OwnerEmployeeID])

  // Update amount from line items total
  useEffect(() => {
    const roundedTotal = Number(lineItemsTotal.toFixed(2))
    setFormData(prev => {
      const currentAmount = prev.Amount ?? 0
      if (Math.abs(currentAmount - roundedTotal) < 0.005) {
        return prev
      }
      return {
        ...prev,
        Amount: roundedTotal,
      }
    })
  }, [lineItemsTotal])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Opportunity>) => {
      const cleanData: Partial<Opportunity> = { ...data }

      if (!cleanData.ContactID) {
        delete cleanData.ContactID
      }
      if (!cleanData.OwnerEmployeeID) {
        delete cleanData.OwnerEmployeeID
      }
      if (!cleanData.ExpectedCloseDate) {
        delete cleanData.ExpectedCloseDate
      }

      const stageValue = cleanData.Stage ?? opportunity?.Stage ?? defaultStage
      const isClosedStage = isClosedStageValue(stageValue)

      if (!isClosedStage) {
        delete cleanData.ClosedAt
        delete cleanData.CloseReason
        delete cleanData.ClosedByEmployeeID
      } else {
        if (!cleanData.ClosedAt) {
          delete cleanData.ClosedAt
        }

        if (typeof cleanData.CloseReason === 'string') {
          cleanData.CloseReason = cleanData.CloseReason.trim()
          if (cleanData.CloseReason === '') {
            delete cleanData.CloseReason
          }
        }

        if (!cleanData.ClosedByEmployeeID) {
          delete cleanData.ClosedByEmployeeID
        }
      }

      if (isEdit) {
        return api.patch(`/Opportunities(${id})`, cleanData)
      }
      return api.post('/Opportunities', cleanData)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
        navigate(`/opportunities/${id}`)
      } else {
        const created = response.data as Opportunity
        navigate(`/opportunities/${created.ID}`)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const opportunityId = opportunity?.ID

    const sanitizedLineItems = lineItems
      .filter(item => item.ProductID)
      .map(item => {
        const { subtotal, total } = calculateLineItemTotals(item)
        const quantity = item.Quantity > 0 ? item.Quantity : 1

        const payload: Partial<OpportunityLineItem> = {
          ProductID: item.ProductID!,
          Quantity: quantity,
          UnitPrice: item.UnitPrice,
          DiscountAmount: item.DiscountAmount,
          DiscountPercent: item.DiscountPercent,
          Subtotal: subtotal,
          Total: total,
          CurrencyCode: item.CurrencyCode || formData.CurrencyCode || currencyCode,
        }

        if (opportunityId) {
          payload.OpportunityID = opportunityId
        }

        if (item.ID) {
          payload.ID = item.ID
        }

        return payload
      })

    if (sanitizedLineItems.length === 0) {
      setLineItemError('Add at least one line item with a selected product before saving.')
      return
    }

    setLineItemError(null)

    const payload: Partial<Opportunity> = {
      ...formData,
      CurrencyCode: formData.CurrencyCode || currencyCode,
      Amount: Number(lineItemsTotal.toFixed(2)),
      LineItems: sanitizedLineItems as OpportunityLineItem[],
    }

    mutation.mutate(payload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'Amount') {
      return
    }
    let parsedValue: string | number | undefined = value

    if (['AccountID', 'ContactID', 'OwnerEmployeeID', 'Stage', 'ClosedByEmployeeID'].includes(name)) {
      parsedValue = value ? parseInt(value, 10) : undefined
    }

    if (name === 'Probability') {
      parsedValue = value ? parseInt(value, 10) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }))
  }

  const handleProductChange = (tempId: string) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const productValue = event.target.value
    const productId = productValue ? parseInt(productValue, 10) : undefined
    const selectedProduct = products.find(product => product.ID === productId)
    const productCurrency = selectedProduct?.CurrencyCode

    if (productCurrency && formData.CurrencyCode && productCurrency !== formData.CurrencyCode) {
      setLineItemError(
        `Selected product currency (${productCurrency}) does not match opportunity currency (${formData.CurrencyCode}).`,
      )
    } else {
      setLineItemError(null)
    }

    if (!formData.CurrencyCode && productCurrency) {
      setFormData(prev => ({
        ...prev,
        CurrencyCode: productCurrency,
      }))
    }

    setLineItems(prev =>
      prev.map(item => {
        if (item.tempId !== tempId) {
          return item
        }

        return {
          ...item,
          ProductID: productId,
          ProductName: selectedProduct?.Name ?? item.ProductName,
          UnitPrice: selectedProduct ? selectedProduct.Price : item.UnitPrice,
          CurrencyCode: productCurrency ?? item.CurrencyCode,
        }
      }),
    )

    if (!productCurrency || !formData.CurrencyCode || productCurrency === formData.CurrencyCode) {
      setLineItemError(null)
    }
  }

  const handleLineItemValueChange = (
    tempId: string,
    field: 'Quantity' | 'UnitPrice' | 'DiscountAmount' | 'DiscountPercent',
  ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value

      setLineItems(prev =>
        prev.map(item => {
          if (item.tempId !== tempId) {
            return item
          }

          const updated = { ...item }

          if (field === 'Quantity') {
            const parsed = Number.parseInt(value, 10)
            updated.Quantity = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed
          } else {
            const parsed = Number.parseFloat(value)
            if (field === 'DiscountPercent') {
              updated.DiscountPercent = Number.isNaN(parsed)
                ? 0
                : Math.min(100, Math.max(0, parsed))
            } else if (field === 'UnitPrice' || field === 'DiscountAmount') {
              updated[field] = Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
            }
          }

          return updated
        }),
      )

      setLineItemError(null)
    }

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, createEmptyLineItem(formData.CurrencyCode || currencyCode)])
    setLineItemError(null)
  }

  const handleRemoveLineItem = (tempId: string) => {
    setLineItems(prev => {
      const filtered = prev.filter(item => item.tempId !== tempId)
      return filtered.length > 0 ? filtered : [createEmptyLineItem(formData.CurrencyCode || currencyCode)]
    })
    setLineItemError(null)
  }

  const accounts = (accountsData?.items as Account[]) || []
  const contacts = selectedAccountId ? ((contactsData?.items as Contact[]) || []) : []
  const employees = (employeesData?.items as Employee[]) || []
  const products = (productsData?.items as Product[]) || []
  const isClosedStageSelected = isClosedStageValue(formData.Stage)
  const isClosedLostSelected = formData.Stage === CLOSED_LOST_STAGE

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Opportunity' : 'Create Opportunity'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track pipeline details, ownership, and forecasted close dates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Opportunity Name"
              type="text"
              name="Name"
              value={formData.Name || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="AccountID" className="label">
              Account *
            </label>
            <select
              id="AccountID"
              name="AccountID"
              value={formData.AccountID || ''}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select an account</option>
              {accounts.map((account: Account) => (
                <option key={account.ID} value={account.ID}>
                  {account.Name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ContactID" className="label">
              Contact
            </label>
            <select
              id="ContactID"
              name="ContactID"
              value={formData.ContactID || ''}
              onChange={handleChange}
              className="input"
              disabled={!selectedAccountId}
            >
              <option value="">Select a contact</option>
              {contacts.map((contact: Contact) => (
                <option key={contact.ID} value={contact.ID}>
                  {contact.FirstName} {contact.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Amount *"
              type="number"
              name="Amount"
              min="0"
              step="0.01"
              value={formData.Amount ?? 0}
              readOnly
            />
          </div>

          <div>
            <Input
              label="Probability (%) *"
              type="number"
              name="Probability"
              min="0"
              max="100"
              value={formData.Probability ?? ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="Stage" className="label">
              Stage *
            </label>
            <select
              id="Stage"
              name="Stage"
              value={formData.Stage || defaultStage}
              onChange={handleChange}
              required
              className="input"
            >
              {stageOptions.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          {isClosedStageSelected && (
            <>
              <div>
                <Input
                  label="Actual Close Date"
                  type="date"
                  name="ClosedAt"
                  value={formatDateForInput(formData.ClosedAt)}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Close Reason"
                  name="CloseReason"
                  value={formData.CloseReason || ''}
                  onChange={handleChange}
                  rows={3}
                  required={isClosedLostSelected}
                  placeholder={isClosedLostSelected ? 'Provide the reason this opportunity was lost.' : 'Capture the reason this opportunity was closed.'}
                />
              </div>

              <div>
                <label htmlFor="ClosedByEmployeeID" className="label">
                  Closed By
                </label>
                <select
                  id="ClosedByEmployeeID"
                  name="ClosedByEmployeeID"
                  value={formData.ClosedByEmployeeID || ''}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee: Employee) => (
                    <option key={employee.ID} value={employee.ID}>
                      {employee.FirstName} {employee.LastName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="OwnerEmployeeID" className="label">
              Owner
            </label>
            <select
              id="OwnerEmployeeID"
              name="OwnerEmployeeID"
              value={formData.OwnerEmployeeID || ''}
              onChange={handleChange}
              className="input"
            >
              <option value="">Unassigned</option>
              {employees.map((employee: Employee) => (
                <option key={employee.ID} value={employee.ID}>
                  {employee.FirstName} {employee.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Expected Close Date"
              type="date"
              name="ExpectedCloseDate"
              value={formData.ExpectedCloseDate ? new Date(formData.ExpectedCloseDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Description"
            name="Description"
            value={formData.Description || ''}
            onChange={handleChange}
            rows={4}
            placeholder="Provide context, next steps, or key stakeholders for this opportunity."
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h2>
            <Button type="button" variant="secondary" onClick={handleAddLineItem}>
              Add Line Item
            </Button>
          </div>

          {lineItems.map((item, index) => {
            const { subtotal, total } = calculateLineItemTotals(item)
            const selectedProduct = products.find(product => product.ID === item.ProductID)
            const productLabel = selectedProduct?.Name ?? item.ProductName ?? 'Select a product'

            return (
              <div
                key={item.tempId}
                className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Line Item {index + 1}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{productLabel}</p>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleRemoveLineItem(item.tempId)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <label htmlFor={`product-${item.tempId}`} className="label">
                      Product *
                    </label>
                    <select
                      id={`product-${item.tempId}`}
                      name="ProductID"
                      className="input"
                      value={item.ProductID ?? ''}
                      onChange={handleProductChange(item.tempId)}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.ID} value={product.ID}>
                          {product.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Quantity *"
                      type="number"
                      min={1}
                      name={`Quantity-${item.tempId}`}
                      value={item.Quantity}
                      onChange={handleLineItemValueChange(item.tempId, 'Quantity')}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Unit Price *"
                      type="number"
                      min={0}
                      step="0.01"
                      name={`UnitPrice-${item.tempId}`}
                      value={item.UnitPrice}
                      onChange={handleLineItemValueChange(item.tempId, 'UnitPrice')}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Discount Amount"
                      type="number"
                      min={0}
                      step="0.01"
                      name={`DiscountAmount-${item.tempId}`}
                      value={item.DiscountAmount}
                      onChange={handleLineItemValueChange(item.tempId, 'DiscountAmount')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Discount %"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      name={`DiscountPercent-${item.tempId}`}
                      value={item.DiscountPercent}
                      onChange={handleLineItemValueChange(item.tempId, 'DiscountPercent')}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(subtotal, item.CurrencyCode || resolvedCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Line Total</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(total, item.CurrencyCode || resolvedCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {lineItemError && (
            <p className="text-sm text-error-600 dark:text-error-400">{lineItemError}</p>
          )}

          <div className="flex flex-col items-end gap-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex gap-2">
              <span>Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(lineItemsSubtotal, resolvedCurrency)}
              </span>
            </div>
            <div className="flex gap-2">
              <span>Discounts:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                -{formatCurrency(totalDiscount, resolvedCurrency)}
              </span>
            </div>
            <div className="flex gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
              <span>Deal Total:</span>
              <span>{formatCurrency(lineItemsTotal, resolvedCurrency)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(isEdit ? `/opportunities/${id}` : '/opportunities')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-error-600 dark:text-error-400 text-sm">
            Failed to save opportunity. Please review the form and try again.
          </p>
        )}
      </form>
    </div>
  )
}
