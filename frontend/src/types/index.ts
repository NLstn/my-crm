export interface Account {
  ID: number
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
  CreatedAt: string
  UpdatedAt: string
  Contacts?: Contact[]
  Issues?: Issue[]
  Employee?: Employee
}

export interface Contact {
  ID: number
  AccountID: number
  FirstName: string
  LastName: string
  Title?: string
  Email?: string
  Phone?: string
  Mobile?: string
  IsPrimary: boolean
  Notes?: string
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
}

export interface Issue {
  ID: number
  AccountID: number
  ContactID?: number
  Title: string
  Description?: string
  Status: number // IssueStatus enum value from backend
  Priority: number // IssuePriority enum value from backend
  AssignedTo?: string
  Resolution?: string
  EmployeeID?: number
  DueDate?: string
  ResolvedAt?: string
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
  Contact?: Contact
  Employee?: Employee
}

// Re-export enum utilities from lib/enums
// These are now dynamically loaded from the backend OData metadata
export {
  issueStatusToString,
  issuePriorityToString,
  getIssueStatuses as ISSUE_STATUSES,
  getIssuePriorities as ISSUE_PRIORITIES,
} from '../lib/enums'

export interface Employee {
  ID: number
  FirstName: string
  LastName: string
  Email?: string
  Phone?: string
  Department?: string
  Position?: string
  HireDate?: string
  Notes?: string
  CreatedAt: string
  UpdatedAt: string
}

export interface Product {
  ID: number
  Name: string
  SKU?: string
  Category?: string
  Description?: string
  Price: number
  Cost: number
  Stock: number
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
}

export interface PipelineStageMetric {
  Stage: string
  TotalValue: number
  OpportunityCount: number
}

export interface IssueSLABreachMetric {
  Priority: string
  Count: number
}

export interface ActivityCompletionMetric {
  Type: string
  Count: number
}

export interface ProductRevenueMetric {
  ProductID: number
  ProductName: string
  DealCount: number
  TotalRevenue: number
}

export interface AtRiskAccountMetric {
  AccountID: number
  AccountName: string
  OpenIssueCount: number
  DaysSinceLastActivity?: number
  LastActivityAt?: string
  RiskReasons: string
}

export interface DashboardFilters {
  startDate?: string
  endDate?: string
  ownerId?: number
}
