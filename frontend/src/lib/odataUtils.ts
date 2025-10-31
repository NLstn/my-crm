/**
 * Utility functions for working with OData query parameters
 */

/**
 * Merges a query string from EntitySearch with additional OData parameters
 * Prevents duplicate parameters by parsing and reconstructing the query
 * 
 * @param searchQuery - Query string from EntitySearch component (e.g., "?$search=test&$top=10")
 * @param additionalParams - Additional OData parameters to include (e.g., { $expand: "Contacts" })
 * @returns Complete query string with all parameters
 */
export function mergeODataQuery(
  searchQuery: string,
  additionalParams: Record<string, string> = {}
): string {
  // Parse existing query parameters
  const params = new URLSearchParams(searchQuery.startsWith('?') ? searchQuery.slice(1) : searchQuery)
  
  // Add additional parameters (won't duplicate if they already exist)
  Object.entries(additionalParams).forEach(([key, value]) => {
    if (!params.has(key)) {
      params.set(key, value)
    }
  })
  
  // Return query string
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
