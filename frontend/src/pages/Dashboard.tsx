export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your CRM system
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">-</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">-</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">-</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/accounts/new"
            className="btn btn-primary text-center"
          >
            Create Account
          </a>
          <a
            href="/contacts/new"
            className="btn btn-primary text-center"
          >
            Add Contact
          </a>
          <a
            href="/issues/new"
            className="btn btn-primary text-center"
          >
            Create Issue
          </a>
        </div>
      </div>
    </div>
  )
}
