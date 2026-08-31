import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, CirclePlus, UserPlus } from 'lucide-react'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'
import { type LabelValue } from '@/data/contractProcessingMock'
import {
  ACCOUNT_CUSTOMER_OPTIONS,
  ACCOUNT_STATUS_STYLES,
  DEFAULT_ACCOUNT_NAME,
  isPioneerMatch,
  resolveAccountOption,
} from './AccountCustomerPicker'

const DRAFT_STATUS_STYLE = 'bg-amber-50 text-amber-800'

export const ACCOUNT_PICKER_V2_VARIANT_IDS = [
  'account-picker-v2',
  'account-picker-v2-single',
  'account-picker-v2-no-match',
] as const

export type AccountPickerV2VariantId = (typeof ACCOUNT_PICKER_V2_VARIANT_IDS)[number]
export type AccountPickerV2Scenario = 'multiple-matches' | 'single-match' | 'no-match'

export function isAccountPickerV2Variant(
  variantId: string | null | undefined
): variantId is AccountPickerV2VariantId {
  return ACCOUNT_PICKER_V2_VARIANT_IDS.includes(variantId as AccountPickerV2VariantId)
}

export function getAccountPickerV2Scenario(
  variantId: string | null | undefined
): AccountPickerV2Scenario | null {
  switch (variantId) {
    case 'account-picker-v2':
      return 'multiple-matches'
    case 'account-picker-v2-single':
      return 'single-match'
    case 'account-picker-v2-no-match':
      return 'no-match'
    default:
      return null
  }
}

export interface AccountPickerV2Seed {
  accountName: string
  options: string[]
  createdCustomerName: string | null
  customerTitleConfirmed: boolean
  contactName: string
  email: string
}

const MULTIPLE_MATCH_OPTIONS = ACCOUNT_CUSTOMER_OPTIONS.map((option) => option.name)
const UNMATCHED_CATALOG_OPTIONS = ['Atlas BioSystems', 'Cascade Networks', 'Horizon Analytics']

export function getAccountPickerV2Seed(scenario: AccountPickerV2Scenario): AccountPickerV2Seed {
  switch (scenario) {
    case 'multiple-matches':
      return {
        accountName: DEFAULT_ACCOUNT_NAME,
        options: MULTIPLE_MATCH_OPTIONS,
        createdCustomerName: null,
        customerTitleConfirmed: false,
        contactName: 'Alex Nguyen',
        email: 'alex.nguyen@pioneersystems.com',
      }
    case 'single-match':
      return {
        accountName: DEFAULT_ACCOUNT_NAME,
        options: [DEFAULT_ACCOUNT_NAME, ...UNMATCHED_CATALOG_OPTIONS],
        createdCustomerName: null,
        customerTitleConfirmed: false,
        contactName: 'Alex Nguyen',
        email: 'alex.nguyen@pioneersystems.com',
      }
    case 'no-match':
      return {
        accountName: DEFAULT_ACCOUNT_NAME,
        options: UNMATCHED_CATALOG_OPTIONS,
        createdCustomerName: DEFAULT_ACCOUNT_NAME,
        customerTitleConfirmed: true,
        contactName: 'Alex Nguyen',
        email: 'alex.nguyen@pioneersystems.com',
      }
  }
}

export function applyAccountPickerV2Seed(
  items: LabelValue[],
  seed: AccountPickerV2Seed
): LabelValue[] {
  return items.map((item) => {
    if (item.label === 'Account') {
      return { ...item, value: seed.accountName, options: seed.options }
    }
    if (item.label === 'Contact name') return { ...item, value: seed.contactName }
    if (item.label === 'Email') return { ...item, value: seed.email }
    return { ...item }
  })
}

export interface AccountCustomerPickerV2Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  options: string[]
  value: string
  createdCustomerName?: string | null
  /** Details for the created customer, which has no catalog record to read. */
  createdCustomerContact?: { contactName: string; email: string }
  highlightSelected?: boolean
  /** Resting-state badge on the current value; hidden while typing. */
  showBestMatch?: boolean
  /**
   * Option the extraction ranked highest. It keeps its badge in the list no
   * matter which customer is currently selected.
   */
  bestMatchName?: string | null
  /**
   * No-match scenario: nothing in the catalog matched, so the field edits the
   * new customer's name in place instead of searching. The created record in
   * the list tracks what's typed.
   */
  editsCreatedName?: boolean
  /**
   * No-match only: the created record was extracted from the contract, not
   * authored via "Create as new customer".
   */
  isExtractedCustomer?: boolean
  onSelect: (name: string) => void
  onCreateAsNewCustomer?: (name?: string) => void
}

/**
 * Isolated exploration surface for the next Account picker.
 *
 * V2 turns the field itself into the combobox: clicking the value swaps it for
 * a text input and opens the list in one move, so the search lives where the
 * user clicked instead of inside the menu. Only Account picker V2 variants
 * render this; every other variant stays on AccountCustomerPicker.
 */
export function AccountCustomerPickerV2({
  isOpen,
  onOpenChange,
  options,
  value,
  createdCustomerName,
  createdCustomerContact,
  highlightSelected = false,
  showBestMatch = false,
  bestMatchName,
  editsCreatedName = false,
  isExtractedCustomer = false,
  onSelect,
  onCreateAsNewCustomer,
}: AccountCustomerPickerV2Props) {
  /** Search text, or the draft customer name while editsCreatedName is on. */
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(editsCreatedName ? -1 : 0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      return
    }
    // Name editing starts from the current value so it reads as an edit, not a
    // blank search; the caret lands at the end of the name.
    setQuery(editsCreatedName ? value : '')
    setActiveIndex(editsCreatedName ? -1 : 0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, editsCreatedName, value])

  const draftName = query.trim()
  const rankedOptions = createdCustomerName
    ? [createdCustomerName, ...options.filter((option) => option !== createdCustomerName)]
    : options
  const trimmedQuery = query.trim().toLowerCase()
  const matchesQuery = (option: string) => {
    const customer = resolveAccountOption(option)
    return (
      customer.name.toLowerCase().includes(trimmedQuery) ||
      customer.contactName.toLowerCase().includes(trimmedQuery) ||
      customer.email.toLowerCase().includes(trimmedQuery)
    )
  }
  // While editing the name the text does double duty: it renames the draft and
  // searches the catalog. The draft stays pinned on top so it never filters
  // itself out from under the caret.
  const filteredCatalog = (
    createdCustomerName
      ? options.filter((option) => option !== createdCustomerName)
      : options
  ).filter((option) => !trimmedQuery || matchesQuery(option))
  const hasNoCatalogMatches = !!trimmedQuery && filteredCatalog.length === 0
  const visibleOptions =
    editsCreatedName && createdCustomerName
      ? [createdCustomerName, ...filteredCatalog]
      : trimmedQuery
        ? rankedOptions.filter(matchesQuery)
        : rankedOptions

  const commit = (name: string) => {
    onSelect(name)
    onOpenChange(false)
  }

  const commitCreatedName = () => {
    if (draftName && draftName !== createdCustomerName) {
      onCreateAsNewCustomer?.(draftName)
    }
    onOpenChange(false)
  }

  /** Dismissal alone never renames — the text may well have been a search. */
  const close = () => onOpenChange(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      if (editsCreatedName) {
        onOpenChange(false)
      } else if (query) {
        event.preventDefault()
        setQuery('')
      } else {
        onOpenChange(false)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (visibleOptions.length === 0) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((prev) => {
        if (prev < 0) return event.key === 'ArrowDown' ? 0 : visibleOptions.length - 1
        return (prev + step + visibleOptions.length) % visibleOptions.length
      })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const option = activeIndex >= 0 ? visibleOptions[activeIndex] : undefined
      if (option && option !== createdCustomerName) commit(option)
      else if (editsCreatedName) commitCreatedName()
      else if (option) commit(option)
    }
  }

  return (
    <div ref={anchorRef} className="relative w-full">
      {isOpen ? (
        <div className="flex w-full items-center gap-1.5 rounded bg-neutral-200 px-2 py-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(editsCreatedName ? -1 : 0)
            }}
            onKeyDown={handleKeyDown}
            onClick={(event) => event.stopPropagation()}
            placeholder={editsCreatedName ? 'Customer name' : value || 'Search customers…'}
            aria-label={editsCreatedName ? 'Customer name' : 'Search customers'}
            className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-brand-navy outline-none placeholder:font-medium placeholder:text-brand-fog"
          />
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              close()
            }}
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-mist hover:text-brand-navy"
            aria-label="Close customer list"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className="flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-blue-700 transition-colors group-hover:text-white"
            aria-haspopup="listbox"
            aria-expanded={false}
          >
            <span className={cn(createdCustomerName === value && 'ai-gradient-text')}>
              {value}
            </span>
            <ChevronDown
              size={14}
              className="text-brand-mist transition-colors group-hover:text-white/70"
            />
          </button>
          {createdCustomerName === value ? (
            <UserPlus
              size={14}
              className="shrink-0 ai-gradient-text transition-colors group-hover:text-white"
            />
          ) : null}
          {showBestMatch ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium ai-gradient-text group-hover:text-white">
              <GradientSparkle size={12} />
              Best match
            </span>
          ) : isPioneerMatch(value) && value !== createdCustomerName ? (
            <GradientSparkle size={12} />
          ) : null}
        </span>
      )}

      <AnchoredMenu
        isOpen={isOpen}
        onClose={close}
        anchorRef={anchorRef}
        matchAnchorWidth
        className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
      >
        <div className="max-h-[360px] overflow-y-auto py-1">
          {visibleOptions.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-brand-fog">No customers match.</p>
          ) : (
            visibleOptions.map((option, index) => {
              const isCreatedRecord = !!createdCustomerName && option === createdCustomerName
              const isExtractedRecord = isCreatedRecord && isExtractedCustomer
              const resolved = resolveAccountOption(option)
              const statusLabel = isCreatedRecord ? 'Draft' : resolved.status
              const statusStyle = isCreatedRecord
                ? DRAFT_STATUS_STYLE
                : ACCOUNT_STATUS_STYLES[resolved.status]
              const customer = {
                ...resolved,
                contactName:
                  isCreatedRecord && createdCustomerContact?.contactName
                    ? createdCustomerContact.contactName
                    : resolved.contactName,
                email:
                  isCreatedRecord && createdCustomerContact?.email
                    ? createdCustomerContact.email
                    : resolved.email,
              }
              const isSelected = option === value
              const isActive = index === activeIndex
              const isBlueSelected = isSelected && highlightSelected
              /** Only the navy fill needs light text; the blue row keeps its own. */
              const isNavyFill = isActive && !isBlueSelected
              return (
                <button
                  key={option}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (editsCreatedName && isCreatedRecord) commitCreatedName()
                    else commit(option)
                  }}
                  className={cn(
                    'group/account flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-colors',
                    index !== visibleOptions.length - 1 && 'border-b border-neutral-100',
                    isBlueSelected
                      ? 'bg-blue-50'
                      : isActive
                        ? 'bg-brand-navy'
                        : isSelected
                          ? 'bg-neutral-100'
                          : null
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-[13px] font-semibold tracking-[-0.25px]',
                          isNavyFill
                            ? 'text-white'
                            : isCreatedRecord
                              ? 'ai-gradient-text'
                              : isBlueSelected
                                ? 'text-blue-700'
                                : 'text-brand-navy'
                        )}
                      >
                        {customer.name}
                      </span>
                        {isExtractedRecord ? (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ai-gradient-text',
                            !isBlueSelected && isActive && 'text-white'
                          )}
                        >
                          <GradientSparkle size={12} />
                          Extracted customer
                        </span>
                      ) : option === bestMatchName ? (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ai-gradient-text',
                            !isBlueSelected && isActive && 'text-white'
                          )}
                        >
                          <GradientSparkle size={12} />
                          Best match
                        </span>
                      ) : isPioneerMatch(customer.name) ? (
                        <GradientSparkle size={12} />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                        statusStyle,
                        !isBlueSelected && isActive && 'bg-white/15 text-white'
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'flex min-w-0 items-center gap-1.5 text-[12px]',
                      isBlueSelected
                        ? 'text-blue-700/70'
                        : isActive
                          ? 'text-white/70'
                          : 'text-brand-fog'
                    )}
                  >
                    <span className="truncate">{customer.contactName}</span>
                    <span
                      className={cn(
                        'shrink-0',
                        isBlueSelected
                          ? 'text-blue-700/40'
                          : isActive
                            ? 'text-white/50'
                            : 'text-brand-mist'
                      )}
                    >
                      ·
                    </span>
                    <span className="truncate">{customer.email}</span>
                  </div>
                </button>
              )
            })
          )}
          {editsCreatedName && hasNoCatalogMatches ? (
            <p className="px-3 py-2.5 text-[13px] text-brand-fog">No other customers match.</p>
          ) : null}
        </div>

        <div className="border-t border-neutral-100">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onCreateAsNewCustomer?.(query.trim() || value)
              onOpenChange(false)
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <CirclePlus size={16} className="shrink-0 text-blue-700" />
            Create as new customer
          </button>
        </div>
      </AnchoredMenu>
    </div>
  )
}

export default AccountCustomerPickerV2
