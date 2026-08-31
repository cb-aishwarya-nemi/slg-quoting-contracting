import { useEffect, useRef, useState, type RefObject } from 'react'
import { CirclePlus, Search, X } from 'lucide-react'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { cn } from '@/lib/utils'
import { GradientSparkle } from './GradientSparkle'

export interface AccountCustomerOption {
  name: string
  status: 'Active' | 'Inactive'
  contactName: string
  email: string
}

export const ACCOUNT_CUSTOMER_OPTIONS: AccountCustomerOption[] = [
  { name: 'Pioneer Systems', status: 'Active', contactName: 'Alex Nguyen', email: 'alex.nguyen@pioneersystems.com' },
  { name: 'Pioneer systems', status: 'Active', contactName: 'David Chen', email: 'd.chen@pioneersystems.com' },
  { name: 'Pioneer System', status: 'Active', contactName: 'Rachel Torres', email: 'r.torres@pioneer-system.com' },
  { name: 'Pioneers Systems', status: 'Active', contactName: 'Samira Patel', email: 's.patel@pioneers-systems.com' },
  { name: 'Pinoeer Systems', status: 'Inactive', contactName: 'Morgan Lee', email: 'm.lee@pinoeersystems.com' },
  { name: 'Atlas BioSystems', status: 'Active', contactName: 'Priya Mehta', email: 'p.mehta@atlasbio.com' },
  { name: 'Cascade Networks', status: 'Active', contactName: 'James Wilson', email: 'j.wilson@cascadenet.com' },
  { name: 'Horizon Analytics', status: 'Active', contactName: 'Linda Wang', email: 'l.wang@horizonanalytics.com' },
]

export const ACCOUNT_STATUS_STYLES: Record<AccountCustomerOption['status'], string> = {
  Active: 'bg-green-50 text-green-700',
  Inactive: 'bg-neutral-100 text-brand-navy',
}

export function isPioneerMatch(name: string): boolean {
  return /pione+r/i.test(name) || /pinoeer/i.test(name)
}

export function resolveAccountOption(name: string): AccountCustomerOption {
  return (
    ACCOUNT_CUSTOMER_OPTIONS.find((option) => option.name === name) ?? {
      name,
      status: 'Active',
      contactName: '—',
      email: '—',
    }
  )
}

export const ACCOUNT_NAME_OPTIONS = ACCOUNT_CUSTOMER_OPTIONS.map((option) => option.name)
export const DEFAULT_ACCOUNT_NAME = ACCOUNT_CUSTOMER_OPTIONS[0].name

export interface AccountCustomerPickerProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLButtonElement | null>
  options: string[]
  value: string
  createdCustomerName?: string | null
  highlightSelected?: boolean
  onSelect: (name: string) => void
  onCreateAsNewCustomer?: (name?: string) => void
}

/** Existing Account customer picker, extracted unchanged for safe experimentation. */
export function AccountCustomerPicker({
  isOpen,
  onClose,
  anchorRef,
  options,
  value,
  createdCustomerName,
  highlightSelected = false,
  onSelect,
  onCreateAsNewCustomer,
}: AccountCustomerPickerProps) {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      return
    }
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  const rankedOptions = createdCustomerName
    ? [createdCustomerName, ...options.filter((option) => option !== createdCustomerName)]
    : options
  const query = search.trim().toLowerCase()
  const visibleOptions = query
    ? rankedOptions.filter((option) => {
        const customer = resolveAccountOption(option)
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.contactName.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query)
        )
      })
    : rankedOptions

  return (
    <AnchoredMenu
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      className="w-[380px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
    >
      <div className="border-b border-neutral-100 px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5">
          <Search size={14} className="shrink-0 text-brand-fog" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key !== 'Escape') return
              if (search) {
                event.preventDefault()
                setSearch('')
              } else {
                onClose()
              }
            }}
            placeholder="Search customers…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-fog"
          />
          {search ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSearch('')
                searchRef.current?.focus()
              }}
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-fog hover:bg-neutral-200 hover:text-brand-navy"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto py-1">
        {visibleOptions.length === 0 ? (
          <p className="px-3 py-3 text-[13px] text-brand-fog">No customers match.</p>
        ) : (
          visibleOptions.map((option, index) => {
            const customer = resolveAccountOption(option)
            const isSelected = option === value
            return (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelect(option)
                  onClose()
                }}
                className={cn(
                  'group/account flex w-full cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-colors',
                  index !== visibleOptions.length - 1 && 'border-b border-neutral-100',
                  isSelected && highlightSelected
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
                        isSelected && highlightSelected
                          ? 'text-blue-700'
                          : 'text-brand-navy transition-colors group-hover/account:text-white'
                      )}
                    >
                      {customer.name}
                    </span>
                    {createdCustomerName === customer.name
                      ? null
                      : isPioneerMatch(customer.name) &&
                        (customer.name === DEFAULT_ACCOUNT_NAME ? (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ai-gradient-text',
                            !(isSelected && highlightSelected) &&
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
                      !(isSelected && highlightSelected) &&
                        'group-hover/account:bg-white/15 group-hover/account:text-white'
                    )}
                  >
                    {customer.status}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-1.5 text-[12px]',
                    isSelected && highlightSelected
                      ? 'text-blue-700/70'
                      : 'text-brand-fog transition-colors group-hover/account:text-white/70'
                  )}
                >
                  <span className="truncate">{customer.contactName}</span>
                  <span
                    className={cn(
                      'shrink-0',
                      isSelected && highlightSelected
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
          })
        )}
      </div>

      <div className="border-t border-neutral-100">
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onCreateAsNewCustomer?.(search.trim() || value)
            onClose()
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
        >
          <CirclePlus size={16} className="shrink-0 text-blue-700" />
          Create as new customer
        </button>
      </div>
    </AnchoredMenu>
  )
}

export default AccountCustomerPicker
