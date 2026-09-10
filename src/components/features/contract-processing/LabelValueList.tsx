import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ChevronDown, FileText, Info, Pencil, X, CirclePlus, Check, Search } from 'lucide-react'
import { type LabelValue } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { useOptionalFieldEditHistory } from '@/context/FieldEditHistoryContext'
import { useUseCase } from '@/context/UseCaseContext'
import { AttentionFlagIcon } from './AttentionFlagIcon'
import { applyFieldValue } from './sectionAttention'
import { ACTIVE_FIELD_STYLE } from './fieldStyles'
import { DatePickerField } from './DatePickerField'
import {
  ACCOUNT_CUSTOMER_OPTIONS,
  ACCOUNT_NAME_OPTIONS,
  ACCOUNT_STATUS_STYLES,
  DEFAULT_ACCOUNT_NAME,
  AccountCustomerPicker,
  isPioneerMatch,
  resolveAccountOption,
} from './AccountCustomerPicker'
import {
  AccountCustomerPickerV2,
  getAccountPickerV2Scenario,
  isAccountPickerV2Variant,
} from './AccountCustomerPickerV2'
import { GradientSparkle } from './GradientSparkle'

const FLAG_SLOT = 'mr-1.5 flex w-3 shrink-0 items-center justify-start'

const DATE_FIELD_LABELS = new Set(['Effective date', 'End date'])

function FieldNotice({
  tone,
  message,
  onResolve,
}: {
  tone: 'error' | 'info'
  message: string
  onResolve: () => void
}) {
  const [open, setIsOpen] = useState(false)
  const iconRef = useRef<HTMLButtonElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const hideTimer = useRef<number | null>(null)
  const isError = tone === 'error'
  const Icon = isError ? AlertTriangle : Info

  const clearHide = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = () => {
    clearHide()
    setRect(iconRef.current?.getBoundingClientRect() ?? null)
    setIsOpen(true)
  }

  // Short grace period so the pointer can travel from the icon into the tooltip.
  const scheduleHide = () => {
    clearHide()
    hideTimer.current = window.setTimeout(() => setIsOpen(false), 160)
  }

  useEffect(() => clearHide, [])

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex h-6 w-6 shrink-0 cursor-help items-center justify-center rounded-full',
          isError ? 'text-red-500' : 'text-amber-500'
        )}
        aria-label={message}
      >
        <Icon size={16} strokeWidth={2} />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            className="fixed z-[90] -translate-y-1/2 pl-2"
            style={{ left: rect.right, top: rect.top + rect.height / 2 }}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'max-w-[240px] rounded-lg border bg-white text-[13px] leading-snug shadow-lg',
                isError
                  ? 'border-red-300 text-red-700'
                  : 'border-amber-300 text-amber-800'
              )}
            >
              <div className="px-3 py-2">{message}</div>
              {!isError && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearHide()
                    setIsOpen(false)
                    onResolve()
                  }}
                  className="flex w-full items-center gap-1.5 border-t border-amber-200 px-3 py-2 text-[12px] font-medium text-amber-800 transition-colors hover:bg-amber-50"
                >
                  <Check size={13} strokeWidth={2.5} />
                  Mark as resolved
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

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

interface LabelValueRowProps {
  item: LabelValue
  sectionId?: string
  sectionLabel?: string
  onItemChange?: (label: string, newValue: string) => void
  onRemove?: () => void
  onCreateAsNewCustomer?: (name?: string) => void
  createdCustomerName?: string | null
  accountPickerVariant?: 'current' | 'v2'
  /** Contact details for a customer that only exists in this section. */
  createdCustomerContact?: { contactName: string; email: string }
  /** Opens the section's source preview — same drawer the thumbnails open. */
  onOpenSource?: () => void
  /** Keeps a notice-sized slot on every row, so hover actions line up down the section. */
  reserveNoticeSlot?: boolean
}

function LabelValueRow({
  item,
  sectionId,
  sectionLabel,
  onItemChange,
  onRemove,
  onCreateAsNewCustomer,
  createdCustomerName,
  accountPickerVariant = 'current',
  createdCustomerContact,
  onOpenSource,
  reserveNoticeSlot,
}: LabelValueRowProps) {
  const editHistory = useOptionalFieldEditHistory()
  const { activePage, activeVariant } = useUseCase()
  const selectedOptionBlue =
    activePage === 'customer360' &&
    (activeVariant === 'item-pinned' || isAccountPickerV2Variant(activeVariant))
  const options =
    item.options?.length
      ? item.options
      : item.label === 'Account'
        ? ACCOUNT_NAME_OPTIONS
        : undefined
  const isSelect = !!options
  const isPlaceholderSelect =
    isSelect &&
    (!item.value.trim() || item.value.trim().toLowerCase() === 'select')
  const isDateField = DATE_FIELD_LABELS.has(item.label)
  const isUnresolved = !!item.extractionFailed && !item.value.trim()
  const isEdited =
    !!sectionId && !!editHistory?.isFieldEdited(sectionId, item.label)
  const [noticeResolved, setNoticeResolved] = useState(false)
  const notice = noticeResolved ? undefined : item.notice
  const isErrorRow = notice?.tone === 'error'

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
    isAccountSelect &&
    item.value === DEFAULT_ACCOUNT_NAME &&
    createdCustomerName !== item.value
  const accountQuery = accountSearch.trim().toLowerCase()
  const rankedOptions = !options
    ? []
    : isAccountSelect && createdCustomerName
      ? [createdCustomerName, ...options.filter((option) => option !== createdCustomerName)]
      : options
  const visibleOptions = !rankedOptions.length
    ? []
    : isAccountSelect && accountQuery
      ? rankedOptions.filter((option) => {
          const customer = resolveAccountOption(option)
          return (
            customer.name.toLowerCase().includes(accountQuery) ||
            customer.contactName.toLowerCase().includes(accountQuery) ||
            customer.email.toLowerCase().includes(accountQuery)
          )
        })
      : rankedOptions

  // Kept for generic select fields. Account uses the extracted picker below.
  const genericSelectDropdown = options ? (
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
                    'group/account flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-colors',
                    !isLast && 'border-b border-neutral-100',
                    isSelected && selectedOptionBlue
                      ? 'bg-blue-50'
                      : isSelected
                        ? 'bg-neutral-100 hover:bg-brand-navy'
                        : 'hover:bg-brand-navy'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-[13px] font-semibold tracking-[-0.25px]',
                          isSelected && selectedOptionBlue
                            ? 'text-blue-700'
                            : 'text-brand-navy transition-colors group-hover/account:text-white'
                        )}
                      >
                        {customer.name}
                      </span>
                      {createdCustomerName === customer.name
                        ? null
                        : isPioneerMatch(customer.name) &&
                          (customer.name === ACCOUNT_CUSTOMER_OPTIONS[0].name ? (
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ai-gradient-text',
                              !(isSelected && selectedOptionBlue) &&
                                'group-hover/account:text-white'
                            )}
                          >
                            <GradientSparkle size={12} />
                            Best match
                          </span>
                        ) : (
                          <GradientSparkle size={12} />
                        ))}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                        ACCOUNT_STATUS_STYLES[customer.status],
                        !(isSelected && selectedOptionBlue) &&
                          'group-hover/account:bg-white/15 group-hover/account:text-white'
                      )}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'flex min-w-0 items-center gap-1.5 text-[12px]',
                      isSelected && selectedOptionBlue
                        ? 'text-blue-700/70'
                        : 'text-brand-fog transition-colors group-hover/account:text-white/70'
                    )}
                  >
                    <span className="truncate">{customer.contactName}</span>
                    <span
                      className={cn(
                        'shrink-0',
                        isSelected && selectedOptionBlue
                          ? 'text-blue-700/40'
                          : 'text-brand-mist transition-colors group-hover/account:text-white/50'
                      )}
                    >
                      ·
                    </span>
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
      {isAccountSelect ? (
        <div className="border-t border-neutral-100">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateAsNewCustomer?.(accountSearch.trim() || item.value)
              setIsOpen(false)
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <CirclePlus size={16} className="shrink-0 text-blue-700" />
            Create as new customer
          </button>
        </div>
      ) : null}
    </AnchoredMenu>
  ) : null

  /** V2 owns its trigger too — the field itself is the combobox input. */
  const isAccountComboboxV2 = isAccountSelect && accountPickerVariant === 'v2'
  const selectDropdown =
    isAccountSelect && options ? (
      <AccountCustomerPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        options={options}
        value={item.value}
        createdCustomerName={createdCustomerName}
        highlightSelected={selectedOptionBlue}
        onSelect={commitValue}
        onCreateAsNewCustomer={onCreateAsNewCustomer}
      />
    ) : (
      genericSelectDropdown
    )

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'group row-hover-trail relative flex items-center border-b border-neutral-200 px-2 transition-colors',
        isErrorRow && 'bg-red-50',
        isEdited && !isErrorRow && !isEditing && !isOpen && !dateActive && 'bg-amber-50',
        !isErrorRow && !isEditing && !isOpen && !dateActive && 'cursor-pointer hover:bg-brand-navy hover:border-brand-navy',
        isErrorRow && !isEditing && !isOpen && !dateActive && 'cursor-pointer hover:bg-[#fdd6d6]'
      )}
      style={{ minHeight: 36 }}
    >
      <div
        className={cn(
          'relative z-10 flex w-[210px] shrink-0 items-center',
          !isErrorRow && !isEditing && !isOpen && !dateActive && 'group-hover:[&_.label-text]:text-white'
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
            keepInkOnRowHover={isErrorRow}
          />
        ) : isAccountComboboxV2 && options ? (
          <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <AccountCustomerPickerV2
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              options={options}
              value={item.value}
              createdCustomerName={createdCustomerName}
              createdCustomerContact={createdCustomerContact}
              highlightSelected={selectedOptionBlue}
              showBestMatch={isBestMatch}
              bestMatchName={
                options?.includes(DEFAULT_ACCOUNT_NAME) &&
                createdCustomerName !== DEFAULT_ACCOUNT_NAME
                  ? DEFAULT_ACCOUNT_NAME
                  : null
              }
              editsCreatedName={!!createdCustomerName}
              isExtractedCustomer={
                getAccountPickerV2Scenario(activeVariant) === 'no-match'
              }
              onSelect={commitValue}
              onCreateAsNewCustomer={onCreateAsNewCustomer}
            />
          </div>
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
                  : isPlaceholderSelect
                    ? 'text-brand-fog group-hover:text-white'
                    : 'text-blue-700 group-hover:text-white'
              )}
            >
              <span>{item.value || `Select ${item.label.toLowerCase()}`}</span>
              <ChevronDown size={14} className={cn(
                'transition-colors',
                isOpen ? 'text-brand-mist' : 'text-brand-mist group-hover:text-white/70'
              )} />
            </button>
            {isBestMatch ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium ai-gradient-text group-hover:text-white">
                <GradientSparkle size={12} />
                Best match
              </span>
            ) : null}
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

        <div className="flex shrink-0 items-center gap-0.5">
          {!isEditing && !isOpen && !dateActive && (
            <>
              {onOpenSource && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSource()
                  }}
                  className={cn(
                    'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-[opacity,background-color] group-hover:opacity-100',
                    isErrorRow
                      ? 'text-brand-navy hover:bg-red-200/60'
                      : 'text-white hover:bg-white/15'
                  )}
                  aria-label={`View source for ${item.label}`}
                  title="View source document"
                >
                  <FileText size={14} />
                </button>
              )}
              {onRemove ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove() }}
                  className={cn(
                    'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-[opacity,background-color] group-hover:opacity-100',
                    isErrorRow
                      ? 'text-brand-navy hover:bg-red-200/60'
                      : 'text-white hover:bg-white/15'
                  )}
                  aria-label={`Remove ${item.label}`}
                >
                  <X size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRowClick()
                  }}
                  className={cn(
                    'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-[opacity,background-color] group-hover:opacity-100',
                    isErrorRow
                      ? 'text-brand-navy hover:bg-red-200/60'
                      : 'text-white group-hover:bg-white/15'
                  )}
                  aria-label={`Edit ${item.label}`}
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
              )}
            </>
          )}
          {notice ? (
            <FieldNotice
              tone={notice.tone}
              message={notice.message}
              onResolve={() => setNoticeResolved(true)}
            />
          ) : reserveNoticeSlot ? (
            <span className="h-6 w-6 shrink-0" aria-hidden />
          ) : null}
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
  onCreateAsNewCustomer?: (name?: string) => void
  createdCustomerName?: string | null
  /** Explicit Account picker implementation; current remains the default. */
  accountPickerVariant?: 'current' | 'v2'
  /** Opens the section's source preview from a row's PDF icon. */
  onOpenSource?: () => void
}

export function LabelValueList({
  items,
  sectionId,
  sectionLabel,
  controlled = false,
  onItemChange,
  onItemsChange,
  showAddField,
  onCreateAsNewCustomer,
  createdCustomerName,
  accountPickerVariant = 'current',
  onOpenSource,
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

  // A created customer has no catalog record, so its row in the picker reads
  // its details from the fields the user is editing right here.
  const createdCustomerContact = {
    contactName: listItems.find((i) => i.label === 'Contact name')?.value ?? '',
    email: listItems.find((i) => i.label === 'Email')?.value ?? '',
  }

  const handleAdd = useCallback((labels: string[]) => {
    setCustomFields(prev => [...prev, ...labels.map(l => ({ label: l, value: '' }))])
    setIsPopoverOpen(false)
  }, [])

  const handleRemove = useCallback((label: string) => {
    setCustomFields(prev => prev.filter(f => f.label !== label))
  }, [])

  // One row carrying a notice reserves the slot for all of them, so the hover
  // actions sit at the same place down the whole section.
  const reserveNoticeSlot = listItems.some((item) => item.notice)

  return (
    <div>
      {listItems.map((item) => (
        <LabelValueRow
          key={item.label}
          item={item}
          sectionId={sectionId}
          sectionLabel={sectionLabel}
          onItemChange={handleItemChange}
          onCreateAsNewCustomer={
            item.label === 'Account' ? onCreateAsNewCustomer : undefined
          }
          createdCustomerName={
            item.label === 'Account' ? createdCustomerName : undefined
          }
          createdCustomerContact={
            item.label === 'Account' ? createdCustomerContact : undefined
          }
          accountPickerVariant={accountPickerVariant}
          onOpenSource={onOpenSource}
          reserveNoticeSlot={reserveNoticeSlot}
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
          reserveNoticeSlot={reserveNoticeSlot}
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
