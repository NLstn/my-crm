import api from './api'

const fallbackIssueStatuses = [
  { value: 1, label: 'New' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Pending' },
  { value: 4, label: 'Resolved' },
  { value: 5, label: 'Closed' },
]

const fallbackIssuePriorities = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Critical' },
]

const fallbackOpportunityStages = [
  { value: 1, label: 'Prospecting' },
  { value: 2, label: 'Qualification' },
  { value: 3, label: 'Needs Analysis' },
  { value: 4, label: 'Proposal' },
  { value: 5, label: 'Negotiation' },
  { value: 6, label: 'Closed Won' },
  { value: 7, label: 'Closed Lost' },
]

const fallbackTaskStatuses = [
  { value: 1, label: 'Not Started' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Deferred' },
  { value: 5, label: 'Cancelled' },
]

// Cache for enum values to avoid repeated API calls
const enumCache: {
  issueStatuses: Array<{ value: number; label: string }>
  issuePriorities: Array<{ value: number; label: string }>
  opportunityStages: Array<{ value: number; label: string }>
  taskStatuses: Array<{ value: number; label: string }>
} = {
  issueStatuses: fallbackIssueStatuses,
  issuePriorities: fallbackIssuePriorities,
  opportunityStages: fallbackOpportunityStages,
  taskStatuses: fallbackTaskStatuses,
}

interface ODataMetadata {
  [namespace: string]: {
    [typeName: string]: {
      $Kind?: string
      [memberName: string]: unknown
    }
  }
}

/**
 * Parse OData metadata JSON to extract enum definitions
 */
const formatEnumLabel = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

const parseEnumsFromMetadata = (metadata: ODataMetadata): Map<string, Record<string, number>> => {
  const enums = new Map<string, Record<string, number>>()

  // Iterate through namespaces (e.g., "CRM")
  for (const namespace of Object.keys(metadata)) {
    if (namespace.startsWith('$')) continue // Skip metadata properties like $Version

    const types = metadata[namespace]
    for (const [typeName, typeDef] of Object.entries(types)) {
      // Check if this is an EnumType
      if (typeDef.$Kind === 'EnumType') {
        const members: Record<string, number> = {}
        
        // Extract enum members
        for (const [key, value] of Object.entries(typeDef)) {
          if (!key.startsWith('$') && typeof value === 'number') {
            members[key] = value
          }
        }
        
        enums.set(typeName, members)
      }
    }
  }

  return enums
}

/**
 * Fetch enum definitions from OData metadata endpoint
 */
export const fetchEnums = async (): Promise<void> => {
  try {
    const response = await api.get('/$metadata', {
      headers: {
        Accept: 'application/json',
      },
    })

    const enums = parseEnumsFromMetadata(response.data)

    // Parse IssueStatus
    const issueStatusEnum = enums.get('IssueStatus')
    if (issueStatusEnum) {
      enumCache.issueStatuses = Object.entries(issueStatusEnum).map(([name, value]) => ({
        value,
        label: name === 'InProgress' ? 'In Progress' : formatEnumLabel(name),
      }))
    }

    // Parse IssuePriority
    const issuePriorityEnum = enums.get('IssuePriority')
    if (issuePriorityEnum) {
      enumCache.issuePriorities = Object.entries(issuePriorityEnum).map(([name, value]) => ({
        value,
        label: formatEnumLabel(name),
      }))
    }

    // Parse OpportunityStage
    const opportunityStageEnum = enums.get('OpportunityStage')
    if (opportunityStageEnum) {
      enumCache.opportunityStages = Object.entries(opportunityStageEnum).map(([name, value]) => ({
        value,
        label: formatEnumLabel(name),
      }))
    }

    // Parse TaskStatus
    const taskStatusEnum = enums.get('TaskStatus')
    if (taskStatusEnum) {
      enumCache.taskStatuses = Object.entries(taskStatusEnum).map(([name, value]) => ({
        value,
        label: name === 'NotStarted' ? 'Not Started' : name === 'InProgress' ? 'In Progress' : name,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch enums from backend:', error)
    // Fallback to hardcoded values if fetch fails
    enumCache.issueStatuses = fallbackIssueStatuses
    enumCache.issuePriorities = fallbackIssuePriorities
    enumCache.opportunityStages = fallbackOpportunityStages
    enumCache.taskStatuses = fallbackTaskStatuses
  }
}

/**
 * Get issue status options for dropdowns
 */
export const getIssueStatuses = (): Array<{ value: number; label: string }> => {
  return enumCache.issueStatuses || fallbackIssueStatuses
}

/**
 * Get issue priority options for dropdowns
 */
export const getIssuePriorities = (): Array<{ value: number; label: string }> => {
  return enumCache.issuePriorities || fallbackIssuePriorities
}

/**
 * Get opportunity stage options for dropdowns
 */
export const getOpportunityStages = (): Array<{ value: number; label: string }> => {
  return enumCache.opportunityStages || fallbackOpportunityStages
}

/**
 * Get task status options for dropdowns
 */
export const getTaskStatuses = (): Array<{ value: number; label: string }> => {
  return enumCache.taskStatuses || fallbackTaskStatuses
}

/**
 * Convert issue status value to display string
 */
export const issueStatusToString = (status: number): string => {
  const statuses = getIssueStatuses()
  const found = statuses.find((s) => s.value === status)
  return found ? found.label : 'Unknown'
}

/**
 * Convert issue priority value to display string
 */
export const issuePriorityToString = (priority: number): string => {
  const priorities = getIssuePriorities()
  const found = priorities.find((p) => p.value === priority)
  return found ? found.label : 'Unknown'
}

/**
 * Convert opportunity stage value to display string
 */
export const opportunityStageToString = (stage: number): string => {
  const stages = getOpportunityStages()
  const found = stages.find((s) => s.value === stage)
  return found ? found.label : 'Unknown'
}

/**
 * Convert task status value to display string
 */
export const taskStatusToString = (status: number): string => {
  const statuses = getTaskStatuses()
  const found = statuses.find((s) => s.value === status)
  return found ? found.label : 'Unknown'
}
