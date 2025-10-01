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
