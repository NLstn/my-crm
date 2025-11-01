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
  Activities?: Activity[]
  Tasks?: Task[]
  Opportunities?: Opportunity[]
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
  Opportunities?: Opportunity[]
}

export interface IssueUpdate {
  ID: number
  IssueID: number
  EmployeeID?: number
  Body: string
  CreatedAt: string
  UpdatedAt: string
  Employee?: Employee
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Disqualified'

export interface Lead {
  ID: number
  Name: string
  Email?: string
  Phone?: string
  Company?: string
  Title?: string
  Website?: string
  Source?: string
  Status: LeadStatus
  Notes?: string
  OwnerEmployeeID?: number
  ConvertedAccountID?: number
  ConvertedContactID?: number
  ConvertedAt?: string
  CreatedAt: string
  UpdatedAt: string
  ConvertedAccount?: Account
  ConvertedContact?: Contact
  OwnerEmployee?: Employee
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
  Updates?: IssueUpdate[]
}

export interface Activity {
  ID: number
  AccountID: number
  ContactID?: number
  EmployeeID?: number
  OpportunityID?: number
  ActivityType: string
  Subject: string
  Outcome?: string
  Notes?: string
  ActivityTime: string
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
  Contact?: Contact
  Employee?: Employee
  Opportunity?: Opportunity
}

export interface Task {
  ID: number
  AccountID: number
  ContactID?: number
  EmployeeID?: number
  OpportunityID?: number
  Title: string
  Description?: string
  Owner: string
  Status: number
  DueDate: string
  CompletedAt?: string
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
  Contact?: Contact
  Employee?: Employee
  Opportunity?: Opportunity
}

export interface Opportunity {
  ID: number
  AccountID: number
  ContactID?: number
  OwnerEmployeeID?: number
  Name: string
  Amount: number
  Probability: number
  ExpectedCloseDate?: string
  Stage: number
  Description?: string
  ClosedAt?: string
  CloseReason?: string
  ClosedByEmployeeID?: number
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
  Contact?: Contact
  Owner?: Employee
  ClosedBy?: Employee
  LineItems?: OpportunityLineItem[]
  Activities?: Activity[]
  Tasks?: Task[]
}

export interface OpportunityLineItem {
  ID: number
  OpportunityID: number
  ProductID: number
  Quantity: number
  UnitPrice: number
  DiscountAmount: number
  DiscountPercent: number
  Subtotal: number
  Total: number
  CreatedAt: string
  UpdatedAt: string
  Product?: Product
}

// Re-export enum utilities from lib/enums
// These are now dynamically loaded from the backend OData metadata
export {
  issueStatusToString,
  issuePriorityToString,
  getIssueStatuses as ISSUE_STATUSES,
  getIssuePriorities as ISSUE_PRIORITIES,
  taskStatusToString,
  getTaskStatuses as TASK_STATUSES,
  getOpportunityStages as OPPORTUNITY_STAGES,
  opportunityStageToString,
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
