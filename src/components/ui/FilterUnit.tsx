import { useState, useRef, useEffect, type ReactNode } from 'react'
import { PlusCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnchoredMenu } from './AnchoredMenu'

export interface Filter {
  id: string
  attribute: string
  condition: string
  value: string
}

interface FilterUnitProps {
  filters: Filter[]
  onFiltersChange: (filters: Filter[]) => void
  isExpanded: boolean
  autoStartOnEmpty?: boolean
}

const FILTER_ATTRIBUTES = [
  { id: 'taskId', label: 'Task ID' },
  { id: 'taskType', label: 'Task Type' },
  { id: 'taskName', label: 'Task Name' },
  { id: 'customer', label: 'Customer' },
  { id: 'subject', label: 'Subject' },
  { id: 'status', label: 'Status' },
  { id: 'severity', label: 'Severity' },
  { id: 'owner', label: 'Owner' },
]

const CONDITIONS: Record<string, Array<{ id: string; label: string }>> = {
  text: [
    { id: 'is', label: 'is' },
    { id: 'is_not', label: 'is not' },
    { id: 'contains', label: 'contains' },
    { id: 'does_not_contain', label: 'does not contain' },
  ],
  number: [
    { id: 'equals', label: 'equals' },
    { id: 'not_equals', label: 'not equals' },
    { id: 'greater_than', label: 'greater than' },
    { id: 'less_than', label: 'less than' },
  ],
  date: [
    { id: 'is', label: 'is' },
    { id: 'is_before', label: 'is before' },
    { id: 'is_after', label: 'is after' },
  ],
  select: [
    { id: 'is', label: 'is' },
    { id: 'is_not', label: 'is not' },
  ],
}

const ATTRIBUTE_TYPES: Record<string, string> = {
  taskId: 'text',
  customer: 'text',
  subject: 'text',
  status: 'select',
  taskType: 'select',
  taskName: 'select',
  severity: 'select',
  owner: 'text',
}

const VALUE_OPTIONS: Record<string, string[]> = {
  status: ['Ready for review', 'In review', 'Pending approval', 'Blocked'],
  severity: ['Critical', 'High', 'Medium', 'Low'],
  taskType: ['Contract Ingestion'],
  taskName: ['New deal', 'Early renewal'],
}

type PopoverStep = 'attribute' | 'condition' | 'value'

interface BuildingFilter {
  id: string
  attribute?: string
  condition?: string
  value?: string
  step: PopoverStep
}

export function FilterUnit({ filters, onFiltersChange, isExpanded, autoStartOnEmpty = true }: FilterUnitProps) {
  const [buildingFilter, setBuildingFilter] = useState<BuildingFilter | null>(null)
  const [editingFilter, setEditingFilter] = useState<{ id: string; field: 'attribute' | 'condition' | 'value' } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Mirrors the trigger the popover hangs off, set synchronously with the state
  // that opens it so the menu measures against the right button on first paint.
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [activePopoverTrigger, setActivePopoverTrigger] = useState<HTMLButtonElement | null>(null)
  const hasAutoStartedRef = useRef(false)

  const openPopoverFrom = (trigger: HTMLButtonElement | null) => {
    anchorRef.current = trigger
    setActivePopoverTrigger(trigger)
  }

  const closePopover = () => {
    setBuildingFilter(null)
    setEditingFilter(null)
    setActivePopoverTrigger(null)
  }

  // Auto-start building filter when expanded with no filters
  useEffect(() => {
    if (isExpanded && filters.length === 0 && autoStartOnEmpty && !hasAutoStartedRef.current && triggerRef.current) {
      hasAutoStartedRef.current = true
      // Use setTimeout to ensure the DOM is ready
      setTimeout(() => {
        if (triggerRef.current) {
          openPopoverFrom(triggerRef.current)
          const newId = `filter-${Date.now()}`
          setBuildingFilter({
            id: newId,
            step: 'attribute',
          })
        }
      }, 100)
    }
    
    // Reset the flag when collapsed or when filters exist
    if (!isExpanded || filters.length > 0) {
      hasAutoStartedRef.current = false
    }
  }, [isExpanded, filters.length, autoStartOnEmpty])

  const startNewFilter = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const newId = `filter-${Date.now()}`
    openPopoverFrom(event ? event.currentTarget : triggerRef.current)
    setBuildingFilter({
      id: newId,
      step: 'attribute',
    })
  }

  const selectAttribute = (attributeId: string) => {
    if (!buildingFilter) return
    
    const attributeType = ATTRIBUTE_TYPES[attributeId]
    const conditions = CONDITIONS[attributeType] || CONDITIONS.text
    const defaultCondition = conditions[0].id

    setBuildingFilter({
      ...buildingFilter,
      attribute: attributeId,
      condition: defaultCondition,
      step: 'condition',
    })
  }

  const selectCondition = (conditionId: string) => {
    if (!buildingFilter) return

    setBuildingFilter({
      ...buildingFilter,
      condition: conditionId,
      step: 'value',
    })
  }

  const selectValue = (value: string) => {
    if (!buildingFilter || !buildingFilter.attribute || !buildingFilter.condition) return

    const newFilter: Filter = {
      id: buildingFilter.id,
      attribute: buildingFilter.attribute,
      condition: buildingFilter.condition,
      value,
    }

    onFiltersChange([...filters, newFilter])
    setBuildingFilter(null)
  }

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id))
  }

  const startEditFilter = (event: React.MouseEvent<HTMLButtonElement>, id: string, field: 'attribute' | 'condition' | 'value') => {
    const filter = filters.find(f => f.id === id)
    if (!filter) return

    openPopoverFrom(event.currentTarget)
    setEditingFilter({ id, field })
    
    if (field === 'attribute') {
      setBuildingFilter({ id, step: 'attribute' })
    } else if (field === 'condition') {
      setBuildingFilter({ 
        id, 
        attribute: filter.attribute, 
        step: 'condition' 
      })
    } else if (field === 'value') {
      setBuildingFilter({ 
        id, 
        attribute: filter.attribute,
        condition: filter.condition,
        step: 'value' 
      })
    }
  }

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    onFiltersChange(filters.map(f => f.id === id ? { ...f, ...updates } : f))
    closePopover()
  }

  const getAttributeLabel = (id: string) => {
    return FILTER_ATTRIBUTES.find(a => a.id === id)?.label || id
  }

  const getConditionLabel = (attributeId: string, conditionId: string) => {
    const attributeType = ATTRIBUTE_TYPES[attributeId]
    const conditions = CONDITIONS[attributeType] || CONDITIONS.text
    return conditions.find(c => c.id === conditionId)?.label || conditionId
  }

  const renderPopover = () => {
    const isEditing = editingFilter !== null
    const currentFilter =
      isEditing && buildingFilter ? filters.find(f => f.id === buildingFilter.id) : null

    let panelClassName = 'w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg'
    let content: ReactNode = null

    if (buildingFilter?.step === 'attribute') {
      content = FILTER_ATTRIBUTES.map(attr => (
        <button
          key={attr.id}
          type="button"
          onClick={() => {
            if (isEditing && currentFilter) {
              updateFilter(buildingFilter.id, { attribute: attr.id })
            } else {
              selectAttribute(attr.id)
            }
          }}
          className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-[13px] text-brand-navy transition-colors hover:bg-blue-50"
        >
          {attr.label}
        </button>
      ))
    } else if (buildingFilter?.step === 'condition' && buildingFilter.attribute) {
      const attributeType = ATTRIBUTE_TYPES[buildingFilter.attribute]
      const conditions = CONDITIONS[attributeType] || CONDITIONS.text

      content = conditions.map(cond => (
        <button
          key={cond.id}
          type="button"
          onClick={() => {
            if (isEditing && currentFilter) {
              updateFilter(buildingFilter.id, { condition: cond.id })
            } else {
              selectCondition(cond.id)
            }
          }}
          className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-[13px] italic text-brand-navy transition-colors hover:bg-blue-50"
        >
          {cond.label}
        </button>
      ))
    } else if (buildingFilter?.step === 'value' && buildingFilter.attribute) {
      const options = VALUE_OPTIONS[buildingFilter.attribute]

      if (options) {
        content = options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (isEditing && currentFilter) {
                updateFilter(buildingFilter.id, { value: option })
              } else {
                selectValue(option)
              }
            }}
            className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-[13px] font-semibold text-brand-navy transition-colors hover:bg-blue-50"
          >
            {option}
          </button>
        ))
      } else {
        panelClassName = 'w-[240px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg'
        content = (
          <>
            <input
              type="text"
              autoFocus
              placeholder="Enter value..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value
                  if (value.trim()) {
                    if (isEditing && currentFilter) {
                      updateFilter(buildingFilter.id, { value })
                    } else {
                      selectValue(value)
                    }
                  }
                }
                if (e.key === 'Escape') {
                  closePopover()
                }
              }}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px] font-semibold text-brand-navy focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-2 text-[11px] text-brand-fog">Press Enter to add</p>
          </>
        )
      }
    }

    return (
      <AnchoredMenu
        isOpen={content != null && activePopoverTrigger != null}
        onClose={closePopover}
        anchorRef={anchorRef}
        className={panelClassName}
      >
        {content}
      </AnchoredMenu>
    )
  }

  return (
    <>
      <div 
        className={cn(
          "overflow-hidden border-t border-neutral-200 transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[100px] opacity-100 pt-2" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex justify-end" style={{ paddingRight: '136px' }}>
          <div className="inline-flex items-center gap-2">
            {/* Existing filters */}
            {filters.map(filter => (
              <div
                key={filter.id}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-navy bg-white px-2 py-1"
              >
                <button
                  type="button"
                  onClick={(e) => startEditFilter(e, filter.id, 'attribute')}
                  className="cursor-pointer text-[12px] font-bold text-brand-navy transition-colors hover:text-blue-700"
                >
                  {getAttributeLabel(filter.attribute)}
                </button>
                <button
                  type="button"
                  onClick={(e) => startEditFilter(e, filter.id, 'condition')}
                  className="cursor-pointer text-[12px] italic text-brand-navy transition-colors hover:text-blue-700"
                >
                  {getConditionLabel(filter.attribute, filter.condition)}
                </button>
                <button
                  type="button"
                  onClick={(e) => startEditFilter(e, filter.id, 'value')}
                  className="cursor-pointer text-[12px] font-semibold text-brand-navy transition-colors hover:text-blue-700"
                >
                  {filter.value}
                </button>
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="ml-1 flex h-4 w-4 cursor-pointer items-center justify-center text-brand-mist hover:text-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add new filter button */}
            <button
              ref={triggerRef}
              type="button"
              onClick={(e) => startNewFilter(e)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <PlusCircle size={14} />
              <span>Add filter</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Popover portal - positioned fixed to viewport */}
      {renderPopover()}
    </>
  )
}
