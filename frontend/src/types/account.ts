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
  accountId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  title: string;
  status?: string;
}
