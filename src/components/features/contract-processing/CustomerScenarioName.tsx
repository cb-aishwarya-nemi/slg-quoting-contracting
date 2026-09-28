import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Search, User, UserPlus, X } from 'lucide-react'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_STATUS_STYLES,
  DEFAULT_ACCOUNT_NAME,
  isPioneerMatch,
  resolveAccountOption,
} from './AccountCustomerPicker'
import { ACTIVE_FIELD_STYLE } from './fieldStyles'
import { GradientSparkle } from './GradientSparkle'

type CustomerScenarioNameSize = 'header' | 'row'

interface CustomerScenarioNameProps {
  name: string
  size: CustomerScenarioNameSize
  showBestMatch?: boolean
  isNewCustomer?: boolean
  showNewCustomerNote?: boolean
  options: string[]
  onSelect: (name: string) => void
  onCreate: (name: string) => void
}

/**
 * Customer name treatment for the Customer scenarios use case.
 * Header and Account row share the pill, edit menu, and actions; each keeps
 * the type size of the place it sits.
 */
export function CustomerScenarioName({
  name,
  size,
  showBestMatch = false,
  isNewCustomer = false,
  showNewCustomerNote = false,
  options,
  onSelect,
  onCreate,
}: CustomerScenarioNameProps) {
  const titleId = useId()
  const pillRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const createSettledRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pendingName, setPendingName] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const isHeader = size === 'header'
  const bestMatchName = options.includes(DEFAULT_ACCOUNT_NAME) ? DEFAULT_ACCOUNT_NAME : null
  const trimmedQuery = query.trim().toLowerCase()
  const visibleOptions = options.filter((option) => {
    if (!trimmedQuery) return true
    const customer = resolveAccountOption(option)
    return (
      customer.name.toLowerCase().includes(trimmedQuery) ||
      customer.contactName.toLowerCase().includes(trimmedQuery) ||
      customer.email.toLowerCase().includes(trimmedQuery)
    )
  })
  const canChoose = !!pendingName && options.includes(pendingName)

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen((open) => !open)
  const openPicker = () => {
    closeMenu()
    setQuery('')
    setPendingName(options.includes(name) ? name : null)
    setPickerOpen(true)
  }
  const closePicker = () => setPickerOpen(false)
  const chooseCustomer = () => {
    if (!pendingName || !options.includes(pendingName)) return
    onSelect(pendingName)
    closePicker()
  }
  const startCreate = () => {
    closeMenu()
    createSettledRef.current = false
    setDraftName('')
    setCreating(true)
  }
  const finishCreate = (commit: boolean) => {
    if (createSettledRef.current) return
    createSettledRef.current = true
    const next = draftName.trim()
    setCreating(false)
    setDraftName('')
    if (commit && next) onCreate(next)
  }

  useEffect(() => {
    if (!creating) return
    const timer = window.setTimeout(() => createInputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [creating])

  useEffect(() => {
    if (!pickerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
    }
  }, [pickerOpen])

  return (
    <div
      className={cn('flex items-center', isHeader ? 'gap-2' : 'gap-1.5')}
      onClick={(event) => event.stopPropagation()}
    >
      {creating ? (
        <label
          className={cn(
            ACTIVE_FIELD_STYLE,
            'inline-flex w-auto items-center bg-neutral-200',
            isHeader ? 'gap-1.5' : 'gap-1'
          )}
        >
          <UserPlus size={14} className="shrink-0 text-brand-mist" />
          <input
            ref={createInputRef}
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={() => finishCreate(true)}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key === 'Enter') {
                event.preventDefault()
                finishCreate(true)
              } else if (event.key === 'Escape') {
                event.preventDefault()
                finishCreate(false)
              }
            }}
            onClick={(event) => event.stopPropagation()}
            placeholder="Enter customer name"
            aria-label="Enter customer name"
            className={cn(
              'bg-transparent text-brand-navy outline-none placeholder:font-medium placeholder:text-brand-fog',
              isHeader
                ? 'w-[168px] font-heading text-[16px] font-semibold leading-6'
                : 'w-[148px] text-[14px] font-medium leading-5'
            )}
            style={isHeader ? { letterSpacing: '-0.5px' } : undefined}
          />
        </label>
      ) : (
        <button
          ref={pillRef}
          type="button"
          aria-label={name ? `Edit customer ${name}` : 'Name this business'}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={toggleMenu}
          className={cn(
            'inline-flex cursor-pointer items-center transition-colors',
            name
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100',
            isHeader ? 'gap-1.5 py-0.5 pl-2 pr-1.5' : 'gap-1 py-px pl-1.5 pr-1.5'
          )}
        >
          {isNewCustomer ? (
            <UserPlus size={isHeader ? 15 : 13} className="shrink-0" />
          ) : (
            <User size={isHeader ? 15 : 13} className="shrink-0" />
          )}
          <span
            className={cn(
              isHeader
                ? 'font-heading text-[16px] font-semibold leading-6'
                : 'text-[14px] font-medium leading-5'
            )}
            style={isHeader ? { letterSpacing: '-0.5px' } : undefined}
          >
            {name || 'Name this business'}
          </span>
          {isHeader && name ? <Pencil size={13} className="shrink-0" /> : null}
        </button>
      )}

      {showBestMatch && !creating ? (
        <span
          className={cn(
            'inline-flex items-center gap-1 font-medium ai-gradient-text',
            isHeader ? 'text-[11px]' : 'text-[11px] group-hover:text-white'
          )}
        >
          <GradientSparkle size={isHeader ? 12 : 11} />
          Best match
        </span>
      ) : null}

      {showNewCustomerNote && isNewCustomer && !creating ? (
        <span className="text-[12px] font-medium ai-gradient-text">New customer will be created</span>
      ) : null}

      <AnchoredMenu
        isOpen={menuOpen}
        onClose={closeMenu}
        anchorRef={pillRef}
        offset={6}
        className={cn(
          'overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg',
          isHeader ? 'w-[240px]' : 'w-[220px]'
        )}
      >
        <button
          type="button"
          role="menuitem"
          onClick={openPicker}
          className={cn(
            'block w-full cursor-pointer px-3 text-left text-brand-navy hover:bg-neutral-50',
            isHeader ? 'py-2 text-[13px]' : 'py-1.5 text-[12px]'
          )}
        >
          Choose existing customer
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={startCreate}
          className={cn(
            'block w-full cursor-pointer px-3 text-left text-brand-navy hover:bg-neutral-50',
            isHeader ? 'py-2 text-[13px]' : 'py-1.5 text-[12px]'
          )}
        >
          Create new customer
        </button>
      </AnchoredMenu>

      {pickerOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-6"
              onMouseDown={closePicker}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                  <h2
                    id={titleId}
                    className="font-heading text-[16px] font-semibold text-brand-navy"
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    Choose existing customer
                  </h2>
                  <button
                    type="button"
                    onClick={closePicker}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="px-4 pb-3">
                  <label className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 focus-within:border-brand-navy">
                    <Search size={14} className="shrink-0 text-brand-mist" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search customers"
                      aria-label="Search customers"
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-brand-navy outline-none placeholder:text-brand-fog"
                    />
                  </label>
                </div>
                <div className="max-h-[360px] overflow-y-auto border-t border-neutral-100 py-1">
                  {visibleOptions.length === 0 ? (
                    <p className="px-4 py-3 text-[13px] text-brand-fog">No customers match.</p>
                  ) : (
                    visibleOptions.map((option, index) => {
                      const customer = resolveAccountOption(option)
                      const isSelected = option === pendingName
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setPendingName(option)}
                          className={cn(
                            'group/account flex w-full cursor-pointer flex-col gap-1 px-4 py-2.5 text-left transition-colors hover:bg-brand-navy',
                            index !== visibleOptions.length - 1 && 'border-b border-neutral-100',
                            isSelected && 'bg-blue-50 hover:bg-blue-50'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={cn(
                                  'truncate text-[13px] font-semibold tracking-[-0.25px] group-hover/account:text-white',
                                  isSelected ? 'text-blue-700 group-hover/account:text-blue-700' : 'text-brand-navy'
                                )}
                              >
                                {customer.name}
                              </span>
                              {option === bestMatchName ? (
                                <span
                                  className={cn(
                                    'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ai-gradient-text',
                                    !isSelected && 'group-hover/account:text-white'
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
                                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                ACCOUNT_STATUS_STYLES[customer.status],
                                !isSelected && 'group-hover/account:bg-white/15 group-hover/account:text-white'
                              )}
                            >
                              {customer.status}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex min-w-0 items-center gap-1.5 text-[12px]',
                              isSelected
                                ? 'text-blue-700/70'
                                : 'text-brand-fog group-hover/account:text-white/70'
                            )}
                          >
                            <span className="truncate">{customer.contactName}</span>
                            <span
                              className={cn(
                                'shrink-0',
                                isSelected
                                  ? 'text-blue-700/40'
                                  : 'text-brand-mist group-hover/account:text-white/50'
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
                <div className="flex justify-end border-t border-neutral-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={chooseCustomer}
                    disabled={!canChoose}
                    className={cn(
                      'cursor-pointer rounded-lg px-4 py-2 font-heading text-[14px] font-semibold transition-colors',
                      canChoose
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'cursor-not-allowed bg-neutral-200 text-neutral-400'
                    )}
                  >
                    Choose
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
