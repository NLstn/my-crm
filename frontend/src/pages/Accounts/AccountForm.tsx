import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Account, Employee, Tag } from '../../types'
import { ACCOUNT_LIFECYCLE_STAGES } from '../../constants/accounts'
import { Button, Input, Textarea, Select, TagSelector } from '../../components/ui'

interface AccountFormValues {
  Name: string
  Industry?: string
  Website?: string
  Phone?: string
  Email?: string
  Address?: string
  City?: string
  State?: string
  Country?: string
  PostalCode?: string
  Description?: string
  EmployeeID?: number
  LifecycleStage: string
}

interface AccountMutationInput {
  values: AccountFormValues
  tagIds: number[]
  originalTagIds: number[]
}

const DEFAULT_STAGE = ACCOUNT_LIFECYCLE_STAGES[0]?.value ?? 'Prospect'

const DEFAULT_FORM_VALUES: AccountFormValues = {
  Name: '',
  Industry: '',
  Website: '',
  Phone: '',
  Email: '',
  Address: '',
  City: '',
  State: '',
  Country: '',
  PostalCode: '',
  Description: '',
  EmployeeID: undefined,
  LifecycleStage: DEFAULT_STAGE,
}

const mapAccountToFormValues = (account: Account): AccountFormValues => ({
  Name: account.Name || '',
  Industry: account.Industry || '',
  Website: account.Website || '',
  Phone: account.Phone || '',
  Email: account.Email || '',
  Address: account.Address || '',
  City: account.City || '',
  State: account.State || '',
  Country: account.Country || '',
  PostalCode: account.PostalCode || '',
  Description: account.Description || '',
  EmployeeID: account.EmployeeID || undefined,
  LifecycleStage: account.LifecycleStage || DEFAULT_STAGE,
})

export default function AccountForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const { data: account } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await api.get(`/Accounts(${id})?$expand=Tags`)
      return response.data as Account
    },
    enabled: isEdit,
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees')
      return response.data
    },
  })

  const {
    data: tagsData,
    isLoading: tagsLoading,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/Tags?$orderby=Name asc')
      return response.data
    },
  })

  const employees = (employeesData?.items as Employee[]) || []
  const tags = (tagsData?.items as Tag[]) || []

  const initialValues = account ? mapAccountToFormValues(account) : { ...DEFAULT_FORM_VALUES }
  const initialTagIds = account?.Tags?.map(tag => tag.ID) ?? []
  const formKey = account ? `account-${account.ID}-${account.UpdatedAt}` : 'new'

  return (
    <AccountFormContent
      key={formKey}
      isEdit={isEdit}
      accountId={id}
      account={account}
      employees={employees}
      tags={tags}
      tagsLoading={tagsLoading}
      initialValues={initialValues}
      initialTagIds={initialTagIds}
    />
  )
}

interface AccountFormContentProps {
  isEdit: boolean
  accountId?: string
  account?: Account
  employees: Employee[]
  tags: Tag[]
  tagsLoading: boolean
  initialValues: AccountFormValues
  initialTagIds: number[]
}

function AccountFormContent({
  isEdit,
  accountId,
  account,
  employees,
  tags,
  tagsLoading,
  initialValues,
  initialTagIds,
}: AccountFormContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AccountFormValues>(initialValues)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds)

  const employeeOptions = useMemo(
    () =>
      employees.map(employee => ({
        value: employee.ID,
        label: `${employee.FirstName} ${employee.LastName}`,
      })),
    [employees],
  )

  const tagOptions = useMemo(
    () =>
      tags.map(tag => ({
        id: tag.ID,
        label: tag.Name,
      })),
    [tags],
  )

  const mutation = useMutation({
    mutationFn: async ({ values, tagIds, originalTagIds }: AccountMutationInput) => {
      const cleanData: Partial<Account> = { ...values }

      if (!cleanData.EmployeeID) {
        delete cleanData.EmployeeID
      }

      if (!cleanData.LifecycleStage) {
        cleanData.LifecycleStage = DEFAULT_STAGE
      }

      let resolvedAccountId: number

      if (isEdit && accountId) {
        await api.patch(`/Accounts(${accountId})`, cleanData)
        resolvedAccountId = Number(accountId)
      } else {
        const response = await api.post('/Accounts', cleanData)
        resolvedAccountId = response.data.ID
      }

      const toAdd = tagIds.filter(tagId => !originalTagIds.includes(tagId))
      const toRemove = originalTagIds.filter(tagId => !tagIds.includes(tagId))

      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map(tagId =>
            api.post(`/Accounts(${resolvedAccountId})/Tags/$ref`, {
              '@odata.id': `/Tags(${tagId})`,
            }),
          ),
        )
      }

      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map(tagId => api.delete(`/Accounts(${resolvedAccountId})/Tags(${tagId})/$ref`)),
        )
      }

      return resolvedAccountId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      if (isEdit && accountId) {
        queryClient.invalidateQueries({ queryKey: ['account', accountId] })
      }
      navigate(isEdit && accountId ? `/accounts/${accountId}` : '/accounts')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const originalTagIds = account?.Tags?.map(tag => tag.ID) ?? []

    mutation.mutate({
      values: formData,
      tagIds: selectedTagIds,
      originalTagIds,
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target
    let value: string | number | undefined = e.target.value

    if (name === 'EmployeeID') {
      value = value ? parseInt(String(value), 10) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Account' : 'Create Account'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Account Name"
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Select
              label="Lifecycle Stage"
              name="LifecycleStage"
              value={formData.LifecycleStage}
              onChange={handleChange}
              options={ACCOUNT_LIFECYCLE_STAGES}
            />
          </div>

          <div>
            <Input
              label="Industry"
              type="text"
              name="Industry"
              value={formData.Industry}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Website"
              type="url"
              name="Website"
              value={formData.Website}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Email"
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Phone"
              type="tel"
              name="Phone"
              value={formData.Phone}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Address"
              type="text"
              name="Address"
              value={formData.Address}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="City"
              type="text"
              name="City"
              value={formData.City}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="State/Province"
              type="text"
              name="State"
              value={formData.State}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Country"
              type="text"
              name="Country"
              value={formData.Country}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Postal Code"
              type="text"
              name="PostalCode"
              value={formData.PostalCode}
              onChange={handleChange}
            />
          </div>

          <div>
            <Select
              label="Responsible Employee"
              name="EmployeeID"
              value={formData.EmployeeID ?? ''}
              onChange={handleChange}
              options={employeeOptions}
              placeholder="Unassigned"
            />
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

          <div className="md:col-span-2">
            <TagSelector
              label="Tags"
              options={tagOptions}
              value={selectedTagIds}
              onChange={setSelectedTagIds}
              disabled={tagsLoading}
              helperText="Use tags to group and filter accounts in reports."
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
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
