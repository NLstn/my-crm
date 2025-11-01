import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import DragDropBoard, { type DragDropBoardColumn } from '@/components/DragDropBoard'
import { Button } from '@/components/ui'
import api from '@/lib/api'
import { OPPORTUNITY_STAGES, type Opportunity } from '@/types'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

interface UpdateStageVariables {
  id: number
  stage: number
}

export default function OpportunitiesBoard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stages = OPPORTUNITY_STAGES()

  const {
    data: opportunities = [],
    isLoading,
    error,
  } = useQuery<Opportunity[]>({
    queryKey: ['opportunities', 'board'],
    queryFn: async () => {
      const response = await api.get('/Opportunities?$expand=Account,Contact,Owner&$orderby=Stage asc,Probability desc')
      return (response.data.items as Opportunity[]) || []
    },
  })

  const mutation = useMutation<void, Error, UpdateStageVariables, { previous?: Opportunity[] }>({
    mutationFn: async ({ id, stage }) => {
      await api.patch(`/Opportunities(${id})`, { Stage: stage })
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities', 'board'] })
      const previous = queryClient.getQueryData<Opportunity[]>(['opportunities', 'board'])

      queryClient.setQueryData<Opportunity[]>(['opportunities', 'board'], (old) => {
        if (!old) return old
        return old.map((opportunity) =>
          opportunity.ID === id
            ? {
                ...opportunity,
                Stage: stage,
                UpdatedAt: new Date().toISOString(),
              }
            : opportunity
        )
      })

      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['opportunities', 'board'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'board'] })
    },
  })

  const columns: Array<DragDropBoardColumn<Opportunity>> = useMemo(() => {
    return stages.map((stage) => {
      const stageItems = opportunities.filter((opportunity) => opportunity.Stage === stage.value)
      const stageTotal = stageItems.reduce((total, opportunity) => total + (opportunity.Amount || 0), 0)
      return {
        id: stage.value.toString(),
        title: stage.label,
        items: stageItems,
        summary:
          stageItems.length > 0
            ? `${currencyFormatter.format(stageTotal)} pipeline`
            : 'No deals',
      }
    })
  }, [opportunities, stages])

  const handleItemDrop = (opportunity: Opportunity, _fromColumnId: string, toColumnId: string) => {
    const nextStage = Number(toColumnId)
    if (!Number.isFinite(nextStage) || opportunity.Stage === nextStage) {
      return
    }

    mutation.mutate({ id: opportunity.ID, stage: nextStage })
  }

  const renderOpportunityCard = (opportunity: Opportunity) => {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opportunity.Name}</div>
          {opportunity.Account && (
            <div className="text-sm text-gray-600 dark:text-gray-400">{opportunity.Account.Name}</div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {currencyFormatter.format(opportunity.Amount)}
          </span>
          <span>{opportunity.Probability}% probability</span>
          {opportunity.ExpectedCloseDate && (
            <span>
              Close {new Date(opportunity.ExpectedCloseDate).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          {opportunity.Owner ? (
            <span>
              Owner: {opportunity.Owner.FirstName} {opportunity.Owner.LastName}
            </span>
          ) : (
            <span>No owner assigned</span>
          )}
          <Link
            to={`/opportunities/${opportunity.ID}`}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            View
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Opportunities Board</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Drag and drop deals between stages to keep your pipeline up to date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/opportunities')}>
            List View
          </Button>
          <Button onClick={() => navigate('/opportunities/new')}>Create Opportunity</Button>
        </div>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-gray-600 dark:text-gray-400">Loading opportunities...</div>
      )}

      {error && (
        <div className="py-8 text-center text-error-600 dark:text-error-400">
          Error loading opportunities: {(error as Error).message}
        </div>
      )}

      {mutation.isError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-700 dark:bg-error-900/40 dark:text-error-300">
          Failed to update opportunity stage. Please try again.
        </div>
      )}

      {!isLoading && !error && (
        <DragDropBoard
          columns={columns}
          renderItem={renderOpportunityCard}
          onItemDrop={handleItemDrop}
          getItemId={(opportunity) => opportunity.ID}
          emptyMessage={
            <div className="space-y-2">
              <p>No opportunities in your pipeline yet.</p>
              <p>Use the create button to add your first deal.</p>
            </div>
          }
        />
      )}
    </div>
  )
}
