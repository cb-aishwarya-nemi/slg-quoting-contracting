import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Pencil, X, CirclePlus, Check, Search } from 'lucide-react'
import { type LabelValue } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { useOptionalFieldEditHistory } from '@/context/FieldEditHistoryContext'
import { AttentionFlagIcon } from './AttentionFlagIcon'
import { GradientSparkle } from './GradientSparkle'
import { applyFieldValue } from './sectionAttention'
import { ACTIVE_FIELD_STYLE } from './fieldStyles'
import { DatePickerField } from './DatePickerField'

const FLAG_SLOT = 'mr-1.5 flex w-3 shrink-0 items-center justify-start'

const DATE_FIELD_LABELS = new Set(['Effective date', 'End date'])

function getUnresolvedMessage(label: string): string {
  return `Data not found. Enter ${label.toLowerCase()}.`
}

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

/** Fallback so Account stays a dropdown even if page state is stale. */
const ACCOUNT_NAME_OPTIONS = [
  'Pioneer Systems',
  'Pioneer systems',
  'Pioneer System',
  'Pioneers Systems',
  'Pinoeer Systems',
  'Atlas BioSystems',
  'Cascade Networks',
  'Horizon Analytics',
]

interface AccountCustomerOption {
  name: string
  status: 'Active' | 'Inactive'
  contactName: string
  email: string
}

/** Near-matches for Pioneer (including typo variants shown in the picker). */
function isPioneerMatch(name: string): boolean {
  return /pione+r/i.test(name) || /pinoeer/i.test(name)
}

/** Rich rows for the Account customer picker (SecondaryNavSwitcher-style). */
const ACCOUNT_CUSTOMER_OPTIONS: AccountCustomerOption[] = [
  {
    name: 'Pioneer Systems',
    status: 'Active',
    contactName: 'Alex Nguyen',
    email: 'alex.nguyen@pioneersystems.com',
  },
  {
    name: 'Pioneer systems',
    status: 'Active',
    contactName: 'David Chen',
    email: 'd.chen@pioneersystems.com',
  },
  {
    name: 'Pioneer System',
    status: 'Active',
    contactName: 'Rachel Torres',
    email: 'r.torres@pioneer-system.com',
  },
  {
    name: 'Pioneers Systems',
    status: 'Active',
    contactName: 'Samira Patel',
    email: 's.patel@pioneers-systems.com',
  },
  {
    name: 'Pinoeer Systems',
    status: 'Inactive',
    contactName: 'Morgan Lee',
    email: 'm.lee@pinoeersystems.com',
  },
  {
    name: 'Atlas BioSystems',
    status: 'Active',
    contactName: 'Priya Mehta',
    email: 'p.mehta@atlasbio.com',
  },
  {
    name: 'Cascade Networks',
    status: 'Active',
    contactName: 'James Wilson',
    email: 'j.wilson@cascadenet.com',
  },
  {
    name: 'Horizon Analytics',
    status: 'Active',
    contactName: 'Linda Wang',
    email: 'l.wang@horizonanalytics.com',
  },
]

const ACCOUNT_STATUS_STYLES: Record<AccountCustomerOption['status'], string> = {
  Active: 'bg-green-50 text-green-700',
  Inactive: 'bg-neutral-100 text-brand-navy',
}

function resolveAccountOption(name: string): AccountCustomerOption {
  return (
    ACCOUNT_CUSTOMER_OPTIONS.find((option) => option.name === name) ?? {
      name,
      status: 'Active',
      contactName: '—',
      email: '—',
    }
  )
}

interface LabelValueRowProps {
  item: LabelValue
  sectionId?: string
  sectionLabel?: string
  onItemChange?: (label: string, newValue: string) => void
  onRemove?: () => void
}

function LabelValueRow({ item, sectionId, sectionLabel, onItemChange, onRemove }: LabelValueRowProps) {
  const editHistory = useOptionalFieldEditHistory()
  const options =
    item.options?.length
      ? item.options
      : item.label === 'Account'
        ? ACCOUNT_NAME_OPTIONS
        : undefined
  const isSelect = !!options
  const isDateField = DATE_FIELD_LABELS.has(item.label)
  const isUnresolved = !!item.extractionFailed && !item.value.trim()
  const isEdited =
    !!sectionId && !!editHistory?.isFieldEdited(sectionId, item.label)

  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [dateActive, setDateActive] = useState(false)
  const [editValue, setEditValue] = useState(item.value)
  const [accountSearch, setAccountSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const accountSearchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setEditValue(item.value)
  }, [item.value])

  // Dropdown / date fields never use the plain text-input edit path.
  useEffect(() => {
    if (isSelect || isDateField) setIsEditing(false)
  }, [isSelect, isDateField])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isOpen) {
      setAccountSearch('')
      return
    }
    if (item.label === 'Account') {
      const timer = window.setTimeout(() => accountSearchRef.current?.focus(), 0)
      return () => window.clearTimeout(timer)
    }
  }, [isOpen, item.label])

  const handleRowClick = () => {
    if (isEditing || isOpen || dateActive) return
    if (isSelect) setIsOpen(true)
    else if (isDateField) setDateActive(true)
    else {
      setEditValue(item.value)
      setIsEditing(true)
    }
  }

  const commitValue = (newValue: string) => {
    const isResolvingExtraction = !!item.extractionFailed && newValue.trim().length > 0
    const valueChanged = newValue !== item.value

    if (onItemChange && (valueChanged || isResolvingExtraction)) {
      if (sectionId && sectionLabel && editHistory && valueChanged) {
        editHistory.recordEdit(
          sectionId,
          { sectionLabel, fieldLabel: item.label },
          item.value,
          newValue
        )
      }
      onItemChange(item.label, newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') {
      setEditValue(item.value)
      setIsEditing(false)
      setIsOpen(false)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    commitValue(editValue)
  }

  const isUnresolvedActive = isUnresolved && (isEditing || isOpen)
  const isAccountSelect = isSelect && item.label === 'Account'
  const isBestMatch =
    isAccountSelect && item.value === ACCOUNT_CUSTOMER_OPTIONS[0].name
  const accountQuery = accountSearch.trim().toLowerCase()
  const visibleOptions = !options
    ? []
    : isAccountSelect && accountQuery
      ? options.filter((option) => {
          const customer = resolveAccountOption(option)
          return (
            customer.name.toLowerCase().includes(accountQuery) ||
            customer.contactName.toLowerCase().includes(accountQuery) ||
            customer.email.toLowerCase().includes(accountQuery)
          )
        })
      : options

  const selectDropdown = options ? (
    <AnchoredMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      anchorRef={triggerRef}
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg',
        isAccountSelect ? 'w-[380px]' : 'min-w-[220px] py-1'
      )}
    >
      {isAccountSelect && (
        <div className="border-b border-neutral-100 px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5">
            <Search size={14} className="shrink-0 text-brand-fog" />
            <input
              ref={accountSearchRef}
              type="text"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  if (accountSearch) {
                    e.preventDefault()
                    setAccountSearch('')
                  } else {
                    setIsOpen(false)
                  }
                }
              }}
              placeholder="Search customers…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-fog"
            />
            {accountSearch ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setAccountSearch('')
                  accountSearchRef.current?.focus()
                }}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-fog hover:bg-neutral-200 hover:text-brand-navy"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        </div>
      )}
      <div className={cn('max-h-[360px] overflow-y-auto', isAccountSelect && 'py-1')}>
        {visibleOptions.length === 0 ? (
          <p className="px-3 py-3 text-[13px] text-brand-fog">No customers match.</p>
        ) : (
          visibleOptions.map((option, index) => {
            const isSelected = option === item.value
            const isLast = index === visibleOptions.length - 1
            if (isAccountSelect) {
              const customer = resolveAccountOption(option)
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    commitValue(option)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-colors',
                    !isLast && 'border-b border-neutral-100',
                    isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold tracking-[-0.25px] text-brand-navy">
                        {customer.name}
                      </span>
                      {isPioneerMatch(customer.name) && (
                        <GradientSparkle size={12} />
                      )}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        ACCOUNT_STATUS_STYLES[customer.status]
                      )}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-brand-fog">
                    <span className="truncate">{customer.contactName}</span>
                    <span className="shrink-0 text-brand-mist">·</span>
                    <span className="truncate">{customer.email}</span>
                  </div>
                </button>
              )
            }

            return (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  commitValue(option)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-[14px] transition-colors',
                  isSelected
                    ? 'bg-neutral-100 font-medium text-brand-navy'
                    : 'text-brand-navy hover:bg-brand-navy hover:text-white'
                )}
              >
                {option}
              </button>
            )
          })
        )}
      </div>
    </AnchoredMenu>
  ) : null

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'group row-hover-trail relative flex items-center border-b border-neutral-200 px-2 transition-colors',
        isEdited && !isEditing && !isOpen && !dateActive && 'bg-amber-50',
        !isEditing && !isOpen && !dateActive && 'cursor-pointer hover:bg-brand-navy hover:border-brand-navy'
      )}
      style={{ minHeight: 36 }}
    >
      <div
        className={cn(
          'relative z-10 flex w-[210px] shrink-0 items-center',
          !isEditing && !isOpen && !dateActive && 'group-hover:[&_.label-text]:text-white'
        )}
      >
        <span className={FLAG_SLOT}>
          {isUnresolved && (
            <AttentionFlagIcon id={item.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()} />
          )}
        </span>
        <span
          className={cn(
            'label-text min-w-0 flex-1 text-left text-[12px] uppercase tracking-[-0.25px] text-brand-navy transition-colors',
            (isEditing || isOpen || dateActive) && 'text-brand-navy'
          )}
        >
          {item.label}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="min-w-0 flex-1 text-left">
        {isUnresolvedActive && isSelect ? (
          <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex cursor-pointer items-center justify-between',
                ACTIVE_FIELD_STYLE,
                // Match focused text fields (`focus:bg-neutral-200`) while the menu is open
                isOpen && 'bg-neutral-200'
              )}
            >
              <span className="text-brand-fog">Select {item.label.toLowerCase()}</span>
              <ChevronDown size={14} className="text-brand-fog" />
            </button>
            {selectDropdown}
          </div>
        ) : isUnresolvedActive ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter value…"
            className={ACTIVE_FIELD_STYLE}
          />
        ) : isUnresolved ? (
          isSelect ? (
            <span className="inline-flex items-center gap-1 text-[14px] font-medium text-brand-fog transition-colors group-hover:text-white">
              Select {item.label.toLowerCase()}
              <ChevronDown
                size={14}
                className="text-brand-mist transition-colors group-hover:text-white/70"
              />
            </span>
          ) : (
            <span className="text-[14px] font-medium text-brand-fog transition-colors group-hover:text-white">
              {getUnresolvedMessage(item.label)}
            </span>
          )
        ) : isDateField ? (
          <DatePickerField
            value={item.value}
            active={dateActive}
            onActiveChange={setDateActive}
            ariaLabel={item.label}
            onChange={(next) => commitValue(next)}
          />
        ) : isSelect ? (
          <div className="relative inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 text-[14px] font-medium transition-colors',
                isOpen
                  ? cn(ACTIVE_FIELD_STYLE, 'w-auto bg-neutral-200')
                  : 'text-blue-700 group-hover:text-white'
              )}
            >
              <span>{item.value}</span>
              <ChevronDown size={14} className={cn(
                'transition-colors',
                isOpen ? 'text-brand-mist' : 'text-brand-mist group-hover:text-white/70'
              )} />
            </button>
            {isBestMatch && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium ai-gradient-text group-hover:text-white">
                <GradientSparkle size={12} />
                Best match
              </span>
            )}
            {selectDropdown}
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
            className={ACTIVE_FIELD_STYLE}
          />
        ) : (
          <span className={cn(
            'text-[14px] font-medium transition-colors',
            item.value
              ? 'text-blue-700 group-hover:text-white'
              : 'text-brand-mist group-hover:text-white/60'
          )}>
            {item.value || 'Click to add value'}
          </span>
        )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isEditing && !isOpen && !dateActive && (
            onRemove ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="flex h-5 w-5 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={14} className="text-white" />
              </button>
            ) : (
              <Pencil
                size={14}
                className="opacity-0 text-white transition-opacity group-hover:opacity-100"
              />
            )
          )}
        </div>
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

  useEffect(() => {
    if (!isOpen) setSelected(new Set())
  }, [isOpen])

  const count = selected.size

  return (
    <AnchoredMenu
      isOpen={isOpen && available.length > 0}
      onClose={onClose}
      anchorRef={anchorRef}
      className="w-[260px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
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
    </AnchoredMenu>
  )
}

// ─── LabelValueList ───────────────────────────────────────────────────────────

interface LabelValueListProps {
  items: LabelValue[]
  sectionId?: string
  sectionLabel?: string
  /** When true, parent owns items state and must handle onItemChange. */
  controlled?: boolean
  onItemChange?: (label: string, newValue: string) => void
  onItemsChange?: (items: LabelValue[]) => void
  showAddField?: boolean
}

export function LabelValueList({
  items,
  sectionId,
  sectionLabel,
  controlled = false,
  onItemChange,
  onItemsChange,
  showAddField,
}: LabelValueListProps) {
  const isControlled = controlled || !!onItemsChange
  const [uncontrolledItems, setUncontrolledItems] = useState<LabelValue[]>(items)
  const [customFields, setCustomFields] = useState<LabelValue[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isControlled) {
      setUncontrolledItems(items)
    }
  }, [items, isControlled])

  const listItems = isControlled ? items : uncontrolledItems

  const handleItemChange = useCallback(
    (label: string, newValue: string) => {
      if (controlled) {
        onItemChange?.(label, newValue)
        return
      }

      if (onItemsChange) {
        onItemsChange(applyFieldValue(listItems, label, newValue))
      } else {
        setUncontrolledItems((prev) => applyFieldValue(prev, label, newValue))
      }

      onItemChange?.(label, newValue)
    },
    [controlled, listItems, onItemChange, onItemsChange]
  )

  const handleCustomFieldChange = useCallback((label: string, newValue: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.label === label ? { ...f, value: newValue } : f))
    )
  }, [])

  const alreadyAdded = [
    ...listItems.map((i) => i.label),
    ...customFields.map((f) => f.label),
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
      {listItems.map((item) => (
        <LabelValueRow
          key={item.label}
          item={item}
          sectionId={sectionId}
          sectionLabel={sectionLabel}
          onItemChange={handleItemChange}
        />
      ))}
      {customFields.map((field) => (
        <LabelValueRow
          key={field.label}
          item={field}
          sectionId={sectionId}
          sectionLabel={sectionLabel}
          onItemChange={handleCustomFieldChange}
          onRemove={() => handleRemove(field.label)}
        />
      ))}
      {showAddField && (
        <div className="relative">
          <button
            ref={addButtonRef}
            type="button"
            onClick={() => setIsPopoverOpen(prev => !prev)}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-neutral-200 px-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            style={{ height: 36 }}
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
