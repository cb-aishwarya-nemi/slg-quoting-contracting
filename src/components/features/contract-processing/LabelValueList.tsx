import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Pencil, X, CirclePlus, Check } from 'lucide-react'
import { type LabelValue } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'

// Fields available to add to the Account section (excludes fields always present)
const ACCOUNT_ADDABLE_FIELDS = [
  'Tax ID / VAT Number',
  'Website',
  'Account type',
  'Company size',
  'Billing email',
  'Account manager',
  'PO Number',
  'SLA tier',
  'Time zone',
  'DUNS Number',
  'Secondary contact',
  'Renewal owner',
]

interface LabelValueRowProps {
  item: LabelValue
  onItemChange?: (label: string, newValue: string) => void
  onRemove?: () => void
}

function LabelValueRow({ item, onItemChange, onRemove }: LabelValueRowProps) {
  const isSelect = !!item.options

  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editValue, setEditValue] = useState(item.value)
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return
    const timer = setTimeout(() => {
      const spaceBelow = window.innerHeight - dropdownRef.current!.getBoundingClientRect().top
      if (spaceBelow < 200) {
        setDropdownPosition({ bottom: '100%', top: 'auto' })
      } else {
        setDropdownPosition({ top: '100%', bottom: 'auto' })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleRowClick = () => {
    if (isEditing || isOpen) return
    if (isSelect) setIsOpen(true)
    else {
      setEditValue(item.value)
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (onItemChange && editValue !== item.value) {
      onItemChange(item.label, editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') {
      setEditValue(item.value)
      setIsEditing(false)
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'group row-hover-trail relative flex items-center border-b border-neutral-200 px-2',
        !isEditing && !isOpen && 'cursor-pointer hover:bg-brand-navy hover:border-brand-navy'
      )}
      style={{ height: 36 }}
    >
      <span className={cn(
        'w-[210px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy transition-colors',
        'group-hover:text-white'
      )}>
        {item.label}
      </span>

      <div className="flex flex-1 items-center justify-between">
        {isSelect ? (
          <div ref={dropdownRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 text-[14px] font-medium transition-colors',
                isEditing || isOpen ? 'text-blue-700' : 'text-blue-700 group-hover:text-white'
              )}
            >
              <span>{item.value}</span>
              <ChevronDown size={14} className={cn(
                'transition-colors',
                isEditing || isOpen ? 'text-brand-mist' : 'text-brand-mist group-hover:text-white/70'
              )} />
            </button>
            {isOpen && (
              <div
                className="absolute left-0 z-50 min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                style={{
                  top: dropdownPosition.top as any,
                  bottom: dropdownPosition.bottom as any,
                  marginTop: dropdownPosition.top === '100%' ? '4px' : '0',
                  marginBottom: dropdownPosition.bottom === '100%' ? '4px' : '0',
                }}
              >
                {item.options!.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onItemChange?.(item.label, option)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full cursor-pointer px-3 py-2 text-left text-[14px] transition-colors',
                      option === item.value
                        ? 'bg-neutral-100 font-medium text-brand-navy'
                        : 'text-brand-navy hover:bg-brand-navy hover:text-white'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="-mx-2 -my-0.5 flex-1 rounded bg-neutral-100 px-2 py-0.5 text-[14px] font-medium text-brand-navy outline-none"
          />
        ) : (
          <span className={cn(
            'text-[14px] font-medium transition-colors',
            item.value
              ? (isEditing || isOpen ? 'text-blue-700' : 'text-blue-700 group-hover:text-white')
              : 'text-brand-mist group-hover:text-white/60'
          )}>
            {item.value || 'Click to add value'}
          </span>
        )}

        {!isEditing && !isOpen && (
          onRemove ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={14} className="text-white" />
            </button>
          ) : (
            <Pencil
              size={14}
              className="ml-2 opacity-0 text-white transition-opacity group-hover:opacity-100"
            />
          )
        )}
      </div>
    </div>
  )
}

// ─── Account Field Popover ────────────────────────────────────────────────────

interface AccountFieldPopoverProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (labels: string[]) => void
  alreadyAdded: string[]
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

function AccountFieldPopover({ isOpen, onClose, onAdd, alreadyAdded, anchorRef }: AccountFieldPopoverProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [position, setPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })
  const popoverRef = useRef<HTMLDivElement>(null)

  const available = ACCOUNT_ADDABLE_FIELDS.filter(f => !alreadyAdded.includes(f))

  const toggle = (label: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleAdd = () => {
    if (selected.size === 0) return
    onAdd(Array.from(selected))
    setSelected(new Set())
  }

  // Calculate position on open
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return
    const timer = setTimeout(() => {
      const anchorRect = anchorRef.current!.getBoundingClientRect()
      const popoverHeight = popoverRef.current?.offsetHeight ?? 340
      const spaceBelow = window.innerHeight - anchorRect.bottom
      const spaceAbove = anchorRect.top
      if (spaceBelow < popoverHeight + 8 && spaceAbove > popoverHeight + 8) {
        setPosition({ bottom: '100%', top: 'auto' })
      } else {
        setPosition({ top: '100%', bottom: 'auto' })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, anchorRef])

  // Reset selection when closed
  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set())
      setPosition({ top: '100%' })
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen || available.length === 0) return null

  const count = selected.size

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 z-50 w-[260px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
      style={{
        top: position.top as any,
        bottom: position.bottom as any,
        marginTop: position.top === '100%' ? '4px' : '0',
        marginBottom: position.bottom === '100%' ? '4px' : '0',
      }}
    >
      <div className="max-h-[280px] overflow-y-auto py-1">
        {available.map((label) => {
          const isSelected = selected.has(label)
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              className="group/item flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-brand-navy hover:text-white"
            >
              <span className={cn(
                'font-medium transition-colors',
                isSelected ? 'text-brand-navy group-hover/item:text-white' : 'text-brand-navy group-hover/item:text-white'
              )}>
                {label}
              </span>
              {isSelected && (
                <Check size={14} className="shrink-0 text-brand-navy group-hover/item:text-white" />
              )}
            </button>
          )
        })}
      </div>
      <div className="border-t border-neutral-100 px-3 py-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={count === 0}
          className={cn(
            'w-full rounded-md py-1.5 text-[13px] font-semibold transition-colors',
            count > 0
              ? 'bg-brand-navy text-white hover:bg-brand-soft'
              : 'cursor-not-allowed bg-neutral-100 text-brand-mist'
          )}
        >
          {count > 0 ? `Add ${count} field${count > 1 ? 's' : ''}` : 'Add fields'}
        </button>
      </div>
    </div>
  )
}

// ─── LabelValueList ───────────────────────────────────────────────────────────

interface LabelValueListProps {
  items: LabelValue[]
  onItemChange?: (label: string, newValue: string) => void
  showAddField?: boolean
}

export function LabelValueList({ items, onItemChange, showAddField }: LabelValueListProps) {
  const [customFields, setCustomFields] = useState<LabelValue[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const alreadyAdded = [
    ...items.map(i => i.label),
    ...customFields.map(f => f.label),
  ]

  const handleAdd = useCallback((labels: string[]) => {
    setCustomFields(prev => [...prev, ...labels.map(l => ({ label: l, value: '' }))])
    setIsPopoverOpen(false)
  }, [])

  const handleRemove = useCallback((label: string) => {
    setCustomFields(prev => prev.filter(f => f.label !== label))
  }, [])

  return (
    <div>
      {items.map((item) => (
        <LabelValueRow key={item.label} item={item} onItemChange={onItemChange} />
      ))}
      {customFields.map((field) => (
        <LabelValueRow
          key={field.label}
          item={field}
          onItemChange={(label, newValue) =>
            setCustomFields(prev => prev.map(f => f.label === label ? { ...f, value: newValue } : f))
          }
          onRemove={() => handleRemove(field.label)}
        />
      ))}
      {showAddField && (
        <div className="relative flex justify-start py-3">
          <button
            ref={addButtonRef}
            type="button"
            onClick={() => setIsPopoverOpen(prev => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <CirclePlus size={16} className="text-blue-700" />
            Add field
          </button>
          <AccountFieldPopover
            isOpen={isPopoverOpen}
            onClose={() => setIsPopoverOpen(false)}
            onAdd={handleAdd}
            alreadyAdded={alreadyAdded}
            anchorRef={addButtonRef}
          />
        </div>
      )}
    </div>
  )
}

export default LabelValueList
