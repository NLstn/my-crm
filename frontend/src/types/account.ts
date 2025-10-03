export interface Account {
  id: string;
  displayId: string;
  name: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  industry: string;
}

export interface Contact {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  fullName: string;
  email: string;
}

export interface Ticket {
  id: string;
  displayId: number;
  accountId: string;
  contactId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  contactId: string;
  title: string;
  status?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
}
