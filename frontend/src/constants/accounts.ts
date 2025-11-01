export interface LifecycleStageOption {
  value: string
  label: string
}

export const ACCOUNT_LIFECYCLE_STAGES: LifecycleStageOption[] = [
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Customer', label: 'Customer' },
  { value: 'Churn Risk', label: 'Churn Risk' },
]

export const getLifecycleStageBadgeClass = (stage?: string) => {
  switch (stage) {
    case 'Prospect':
      return 'badge badge-warning'
    case 'Qualified':
      return 'badge badge-primary'
    case 'Customer':
      return 'badge badge-success'
    case 'Churn Risk':
      return 'badge badge-error'
    default:
      return 'badge badge-neutral'
  }
}
