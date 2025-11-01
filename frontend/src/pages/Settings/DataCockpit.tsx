const BULK_ACTIONS: Array<{
  entity: string;
  importAction: string;
  exportAction: string;
}> = [
  {
    entity: "Accounts",
    importAction: "ImportAccountsCSV",
    exportAction: "ExportAccountsCSV",
  },
  {
    entity: "Contacts",
    importAction: "ImportContactsCSV",
    exportAction: "ExportContactsCSV",
  },
  {
    entity: "Leads",
    importAction: "ImportLeadsCSV",
    exportAction: "ExportLeadsCSV",
  },
  {
    entity: "Activities",
    importAction: "ImportActivitiesCSV",
    exportAction: "ExportActivitiesCSV",
  },
  {
    entity: "Issues",
    importAction: "ImportIssuesCSV",
    exportAction: "ExportIssuesCSV",
  },
  {
    entity: "Tasks",
    importAction: "ImportTasksCSV",
    exportAction: "ExportTasksCSV",
  },
  {
    entity: "Opportunities",
    importAction: "ImportOpportunitiesCSV",
    exportAction: "ExportOpportunitiesCSV",
  },
  {
    entity: "Opportunity Line Items",
    importAction: "ImportOpportunityLineItemsCSV",
    exportAction: "ExportOpportunityLineItemsCSV",
  },
  {
    entity: "Employees",
    importAction: "ImportEmployeesCSV",
    exportAction: "ExportEmployeesCSV",
  },
  {
    entity: "Products",
    importAction: "ImportProductsCSV",
    exportAction: "ExportProductsCSV",
  },
];

export default function DataCockpit() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Data Cockpit
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Centralized catalog of bulk import and export actions exposed through
          the OData service. Use these unbound actions to seed new data, migrate
          records, or extract point-in-time snapshots.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Bulk import/export actions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Each action is invoked with a{" "}
            <code className="font-mono bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">
              POST
            </code>{" "}
            request. Import actions accept a CSV payload and return the number
            of created records; export actions respond with a CSV attachment.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
                >
                  Entity
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
                >
                  Import Action
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
                >
                  Export Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
              {BULK_ACTIONS.map((action) => (
                <tr key={action.entity}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {action.entity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <code className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                      POST /{action.importAction}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <code className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                      POST /{action.exportAction}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Validation responses
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Import endpoints return{" "}
              <code className="font-mono bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
                validation_failed
              </code>{" "}
              errors with row-level details when dependencies (like accounts,
              contacts, or products) are missing.
            </li>
            <li>
              Export endpoints stream UTF-8 CSV files with headers that match
              the importer requirements.
            </li>
          </ul>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Usage tips
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>
            Always include a header row that matches the expected column names
            shown above.
          </li>
          <li>
            Use RFC3339 timestamps for date and time fields to avoid parsing
            issues.
          </li>
          <li>
            Ensure referenced records (accounts, leads, employees, products)
            exist before importing related rows.
          </li>
        </ul>
      </div>
    </div>
  );
}
