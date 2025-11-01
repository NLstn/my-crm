import { useState, type DragEvent, type ReactNode } from 'react'

export interface DragDropBoardColumn<TItem> {
  id: string
  title: string
  items: TItem[]
  summary?: ReactNode
}

interface DragState<TItem> {
  columnId: string
  item: TItem
}

export interface DragDropBoardProps<TItem> {
  columns: Array<DragDropBoardColumn<TItem>>
  /**
   * Renders the card content for a given item.
   */
  renderItem: (item: TItem) => ReactNode
  /**
   * Callback executed when an item is dropped in a different column.
   */
  onItemDrop: (item: TItem, fromColumnId: string, toColumnId: string) => void
  /**
   * Returns a stable identifier for an item for React key usage.
   */
  getItemId: (item: TItem) => string | number
  /**
   * Message displayed when every column is empty.
   */
  emptyMessage?: ReactNode
}

function DragDropBoard<TItem>({
  columns,
  renderItem,
  onItemDrop,
  getItemId,
  emptyMessage,
}: DragDropBoardProps<TItem>) {
  const [dragState, setDragState] = useState<DragState<TItem> | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)

  const handleDragStart = (columnId: string, item: TItem) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(getItemId(item)))
    setDragState({ columnId, item })
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (columnId: string) => (event: DragEvent<HTMLDivElement>) => {
    if (!dragState) return
    event.preventDefault()
    setActiveColumn(columnId)
  }

  const handleDragLeave = (columnId: string) => () => {
    if (activeColumn === columnId) {
      setActiveColumn(null)
    }
  }

  const handleDrop = (columnId: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (dragState && dragState.columnId !== columnId) {
      onItemDrop(dragState.item, dragState.columnId, columnId)
    }
    setDragState(null)
    setActiveColumn(null)
  }

  const handleDragEnd = () => {
    setDragState(null)
    setActiveColumn(null)
  }

  const allColumnsEmpty = columns.every((column) => column.items.length === 0)

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const isActive = activeColumn === column.id
          return (
            <div
              key={column.id}
              className={`flex-none w-80 bg-white dark:bg-gray-900 border ${
                isActive
                  ? 'border-primary-400 dark:border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-800 shadow-sm'
              } rounded-xl p-4 transition-all`}
              onDragOver={handleDragOver}
              onDrop={handleDrop(column.id)}
              onDragEnter={handleDragEnter(column.id)}
              onDragLeave={handleDragLeave(column.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{column.items.length}</span>
              </div>
              {column.summary && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{column.summary}</div>
              )}

              <div className="mt-4 space-y-3">
                {column.items.map((item) => (
                  <div
                    key={getItemId(item)}
                    draggable
                    onDragStart={handleDragStart(column.id, item)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 shadow-sm hover:shadow-md transition-shadow"
                    aria-grabbed={dragState?.item === item}
                  >
                    {renderItem(item)}
                  </div>
                ))}

                {column.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Drag deals here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {allColumnsEmpty && emptyMessage && (
        <div className="text-center text-gray-600 dark:text-gray-400">{emptyMessage}</div>
      )}
    </div>
  )
}

export default DragDropBoard
