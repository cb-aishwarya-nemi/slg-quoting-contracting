import { useState, useRef, useEffect } from 'react'
import { PlusCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [activePopoverTrigger, setActivePopoverTrigger] = useState<HTMLButtonElement | null>(null)
  const hasAutoStartedRef = useRef(false)

  // Auto-start building filter when expanded with no filters
  useEffect(() => {
    if (isExpanded && filters.length === 0 && autoStartOnEmpty && !hasAutoStartedRef.current && triggerRef.current) {
      hasAutoStartedRef.current = true
      // Use setTimeout to ensure the DOM is ready
      setTimeout(() => {
        if (triggerRef.current) {
          setActivePopoverTrigger(triggerRef.current)
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

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      
      // Check if click is outside popover and not on any trigger button
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !activePopoverTrigger?.contains(target)
      ) {
        // Don't close if clicking on another filter part button
        const clickedButton = (event.target as HTMLElement).closest('button')
        if (clickedButton && clickedButton.getAttribute('type') === 'button') {
          return
        }
        
        setBuildingFilter(null)
        setEditingFilter(null)
        setActivePopoverTrigger(null)
      }
    }

    if (buildingFilter || editingFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [buildingFilter, editingFilter, activePopoverTrigger])

  // Position popover to prevent screen cutoff
  useEffect(() => {
    if (popoverRef.current && activePopoverTrigger) {
      const popover = popoverRef.current
      const trigger = activePopoverTrigger
      const rect = trigger.getBoundingClientRect()
      const popoverRect = popover.getBoundingClientRect()

      // Position relative to viewport (fixed positioning)
      popover.style.position = 'fixed'
      popover.style.left = `${rect.left}px`
      popover.style.top = `${rect.bottom + 4}px`

      // Check if popover goes off right edge
      if (rect.left + popoverRect.width > window.innerWidth - 20) {
        popover.style.left = 'auto'
        popover.style.right = '20px'
      }

      // Check if popover goes off bottom edge
      if (rect.bottom + popoverRect.height + 4 > window.innerHeight - 20) {
        popover.style.top = `${rect.top - popoverRect.height - 4}px`
      }
    }
  }, [buildingFilter, editingFilter, activePopoverTrigger])

  const startNewFilter = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const newId = `filter-${Date.now()}`
    if (event) {
      setActivePopoverTrigger(event.currentTarget)
    } else if (triggerRef.current) {
      setActivePopoverTrigger(triggerRef.current)
    }
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

    setActivePopoverTrigger(event.currentTarget)
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
    setBuildingFilter(null)
    setEditingFilter(null)
    setActivePopoverTrigger(null)
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
    if (!buildingFilter) return null

    const isEditing = editingFilter !== null
    const currentFilter = isEditing ? filters.find(f => f.id === buildingFilter.id) : null

    if (buildingFilter.step === 'attribute') {
      return (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-1 w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {FILTER_ATTRIBUTES.map(attr => (
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
          ))}
        </div>
      )
    }

    if (buildingFilter.step === 'condition' && buildingFilter.attribute) {
      const attributeType = ATTRIBUTE_TYPES[buildingFilter.attribute]
      const conditions = CONDITIONS[attributeType] || CONDITIONS.text

      return (
        <div
          ref={popoverRef}
          className="fixed z-50 w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {conditions.map(cond => (
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
          ))}
        </div>
      )
    }

    if (buildingFilter.step === 'value' && buildingFilter.attribute) {
      const options = VALUE_OPTIONS[buildingFilter.attribute]

      if (options) {
        return (
          <div
            ref={popoverRef}
            className="fixed z-50 w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
          >
            {options.map(option => (
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
            ))}
          </div>
        )
      }

      // Text input for free-form values
      return (
        <div
          ref={popoverRef}
          className="fixed z-50 w-[240px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
        >
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
                setBuildingFilter(null)
                setEditingFilter(null)
              }
            }}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px] font-semibold text-brand-navy focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-2 text-[11px] text-brand-fog">Press Enter to add</p>
        </div>
      )
    }

    return null
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
