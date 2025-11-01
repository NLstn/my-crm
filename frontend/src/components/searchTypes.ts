export type GlobalSearchEntityType = 'Account' | 'Contact' | 'Lead' | 'Opportunity' | string

export interface GlobalSearchResult {
  entityType: GlobalSearchEntityType
  entityId: number
  name: string
  path: string
}

export interface GlobalSearchSection {
  title: string
  items: GlobalSearchResult[]
}
