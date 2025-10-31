import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Textarea } from '../../components/ui'
import { useLead, useLeadMutation } from '../../lib/hooks/leads'
import type { Lead, LeadStatus } from '../../types'

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Disqualified']

type LeadFormState = Partial<Pick<Lead, 'Name' | 'Email' | 'Phone' | 'Company' | 'Title' | 'Website' | 'Source' | 'Status' | 'Notes'>>

const EMPTY_FORM: LeadFormState = {
  Name: '',
  Email: '',
  Phone: '',
  Company: '',
  Title: '',
  Website: '',
  Source: '',
  Status: 'New',
  Notes: '',
}

export default function LeadForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: lead } = useLead(id)
  const mutation = useLeadMutation(id)

  const initialFormState = useMemo(() => {
    if (lead) {
      return {
        Name: lead.Name,
        Email: lead.Email || '',
        Phone: lead.Phone || '',
        Company: lead.Company || '',
        Title: lead.Title || '',
        Website: lead.Website || '',
        Source: lead.Source || '',
        Status: lead.Status,
        Notes: lead.Notes || '',
      }
    }
    return { ...EMPTY_FORM }
  }, [lead])

  const [formData, setFormData] = useState<LeadFormState>(initialFormState)

  useEffect(() => {
    setFormData(initialFormState)
  }, [initialFormState])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    mutation.mutate(formData, {
      onSuccess: () => {
        navigate(isEdit ? `/leads/${id}` : '/leads')
      },
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Lead' : 'Capture Lead'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Keep track of new prospects and convert them when they are ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Lead Name"
            name="Name"
            value={formData.Name}
            onChange={handleChange}
            required
          />

          <Input
            label="Company"
            name="Company"
            value={formData.Company}
            onChange={handleChange}
          />

          <Input
            label="Title"
            name="Title"
            value={formData.Title}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="Email"
            type="email"
            value={formData.Email}
            onChange={handleChange}
          />

          <Input
            label="Phone"
            name="Phone"
            value={formData.Phone}
            onChange={handleChange}
          />

          <Input
            label="Website"
            name="Website"
            type="url"
            value={formData.Website}
            onChange={handleChange}
          />

          <Input
            label="Source"
            name="Source"
            value={formData.Source}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="Status" className="label">
              Status
            </label>
            <select
              id="Status"
              name="Status"
              value={formData.Status}
              onChange={handleChange}
              className="input"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Notes"
          name="Notes"
          value={formData.Notes}
          onChange={handleChange}
          rows={4}
        />

        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? (isEdit ? 'Updating...' : 'Saving...') : isEdit ? 'Update Lead' : 'Save Lead'}
          </Button>
        </div>

        {mutation.error && (
          <p className="text-sm text-error-600 dark:text-error-400">
            {(mutation.error as Error).message || 'Failed to save lead.'}
          </p>
        )}
      </form>
    </div>
  )
}
