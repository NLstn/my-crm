import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Contact } from '../../types'
import EntitySearch from '../../components/EntitySearch'

export default function ContactsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Merge search query with expand parameter
  const odataQuery = mergeODataQuery(searchQuery, { '$expand': 'Account' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Contacts${odataQuery}`)
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading contacts: {(error as Error).message}
      </div>
    )
  }

  const contacts = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
        </div>
        <Link to="/contacts/new" className="btn btn-primary">
          Add Contact
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search contacts..."
        sortOptions={[
          { label: 'First Name (A-Z)', value: 'FirstName asc' },
          { label: 'First Name (Z-A)', value: 'FirstName desc' },
          { label: 'Last Name (A-Z)', value: 'LastName asc' },
          { label: 'Last Name (Z-A)', value: 'LastName desc' },
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
        ]}
        filterOptions={[
          {
            label: 'Title',
            key: 'Title',
            type: 'text',
          },
        ]}
        onQueryChange={setSearchQuery}
        totalCount={data?.count || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

      <div className="grid grid-cols-1 gap-4">
        {contacts.map((contact: Contact) => (
          <Link
            key={contact.ID}
            to={`/contacts/${contact.ID}`}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {contact.FirstName} {contact.LastName}
                  {contact.IsPrimary && (
                    <span className="ml-2 badge badge-primary text-xs">Primary</span>
                  )}
                </h3>
                {contact.Title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.Title}</p>
                )}
                {contact.Account && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    🏢 {contact.Account.Name}
                  </p>
                )}
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {contact.Email && <div>📧 {contact.Email}</div>}
                  {contact.Phone && <div>📞 {contact.Phone}</div>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No contacts found</p>
          <Link to="/contacts/new" className="btn btn-primary mt-4 inline-block">
            Add your first contact
          </Link>
        </div>
      )}
    </div>
  )
}
