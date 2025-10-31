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
  CreatedAt: string
  UpdatedAt: string
  Contacts?: Contact[]
  Issues?: Issue[]
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
  Status: IssueStatus
  Priority: IssuePriority
  AssignedTo?: string
  Resolution?: string
  DueDate?: string
  ResolvedAt?: string
  CreatedAt: string
  UpdatedAt: string
  Account?: Account
  Contact?: Contact
}

export type IssueStatus = 'New' | 'InProgress' | 'Pending' | 'Resolved' | 'Closed'
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical'

export const ISSUE_STATUSES: IssueStatus[] = ['New', 'InProgress', 'Pending', 'Resolved', 'Closed']
export const ISSUE_PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

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
