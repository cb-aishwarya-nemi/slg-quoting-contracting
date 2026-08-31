import { useState, useRef, useEffect, type RefObject } from 'react'
import { Calendar, ChevronDown, ChevronUp, CirclePlus, Gauge, Search, TrendingUp, X } from 'lucide-react'
import { AnchoredMenu } from '@/components/ui/AnchoredMenu'
import { cn } from '@/lib/utils'
import {
  entitlementCatalog,
  type AllocationGroup,
  type CatalogEntitlement,
  type RampPeriod,
} from '@/data/contractProcessingMock'

const FEATURE_W = 200
/** Wide enough for “Period N” plus the from/to dates in the header. */
const PERIOD_FEATURE_W = 340
const UNITS_W = 220
/** Numbers right-align inside this track so every unit noun starts at one x. */
const UNITS_COUNT_W = 72
/** Reserved gutter left of the count so a ramp arrow never squeezes the value. */
const RAMP_ICON_W = 16
/** Item has no natural width of its own — this weight keeps it the widest track. */
const ITEM_W = 280

function gridCols(featureWidth: number) {
  return [
    `minmax(${featureWidth}px, ${featureWidth}fr)`,
    `minmax(0, ${ITEM_W}fr)`,
    `minmax(${UNITS_W}px, ${UNITS_W}fr)`,
  ].join(' ')
}

const COLS = gridCols(FEATURE_W)
const PERIOD_COLS = gridCols(PERIOD_FEATURE_W)

function Separator() {
  return <div className="mx-3 h-5 w-px shrink-0 bg-neutral-200" />
}

function EntitlementNameButton({
  name,
  isUsage,
}: {
  name: string
  isUsage?: boolean
}) {
  return (
    <button
      type="button"
      className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded px-1 py-1 text-left text-[14px] font-medium text-brand-navy transition-colors hover:bg-neutral-100"
    >
      <span className="truncate">{name}</span>
      {isUsage && (
        <Gauge
          size={14}
          strokeWidth={2}
          className="shrink-0 text-brand-fog"
          aria-label="Metered feature"
        />
      )}
      <ChevronDown size={14} className="shrink-0 text-brand-mist" />
    </button>
  )
}

const UNITS_FIELD_STYLE =
  'min-w-[4.5rem] max-w-full rounded bg-neutral-100 px-2 py-1 text-right text-[14px] tabular-nums text-brand-navy outline-none focus:bg-neutral-200'

/** Fallback for catalog-added entitlements: the trailing noun of the feature name. */
function unitLabelFromFeature(feature: string): string {
  const words = feature.trim().split(/\s+/)
  return (words[words.length - 1] ?? feature).toLowerCase()
}

function frequencySuffix(frequency: string): string {
  const key = frequency.trim().toLowerCase()
  if (key === 'yearly' || key === 'annual' || key === 'annually') return '/year'
  if (key === 'monthly') return '/month'
  if (key === 'weekly') return '/week'
  if (key === 'daily') return '/day'
  if (key === 'one-time' || key === 'one time') return ''
  return frequency ? `/${key}` : ''
}

function formatUnits(input: string): string {
  const digits = input.replace(/[^\d]/g, '')
  if (!digits) return input.trim() || '0'
  return Number.parseInt(digits, 10).toLocaleString('en-US')
}

function UnitsField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraft(value)
  }, [value, isEditing])

  useEffect(() => {
    if (!isEditing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  const commit = () => {
    const next = formatUnits(draft)
    setDraft(next)
    setIsEditing(false)
    if (next !== value) onCommit(next)
  }

  const cancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        aria-label="Units"
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            cancel()
          }
        }}
        className={UNITS_FIELD_STYLE}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={`Edit units ${value}`}
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value)
        setIsEditing(true)
      }}
      className="cursor-pointer whitespace-nowrap rounded px-1 py-1 text-right text-[14px] tabular-nums text-brand-navy transition-colors hover:bg-neutral-100"
    >
      {value}
    </button>
  )
}

interface AllocationTableProps {
  items: AllocationGroup[]
  /** When present, entitlements render inside the same period accordions as Products. */
  periods?: Pick<RampPeriod, 'id' | 'label' | 'startDate' | 'endDate' | 'periodChange'>[]
}

const GROWTH_SERVICES_ITEM = 'Apex platform - growth services'
const PERIOD_2_API_CALLS = '40,000'

function cloneGroups(groups: AllocationGroup[], prefix: string): AllocationGroup[] {
  const isPeriod2 = prefix === 'period-2'
  return groups.map((group) => {
    const sources = group.sources.map((source) => {
      const ramped =
        isPeriod2 &&
        group.feature === 'API calls' &&
        source.name === GROWTH_SERVICES_ITEM
      return {
        ...source,
        id: `${prefix}-${source.id}`,
        units: ramped ? PERIOD_2_API_CALLS : source.units,
        rampUnitsChange: ramped || undefined,
      }
    })
    return {
      ...group,
      id: `${prefix}-${group.id}`,
      units:
        isPeriod2 && group.feature === 'API calls'
          ? sources.reduce((sum, source) => sum + Number.parseInt(source.units.replace(/,/g, ''), 10), 0).toLocaleString('en-US')
          : group.units,
      sources,
    }
  })
}

function PeriodChevron({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className="-ml-6 mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-blue-700 transition-colors hover:bg-blue-50"
      title={isExpanded ? 'Collapse period' : 'Expand period'}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  )
}

function PeriodIdentity({
  period,
}: {
  period: Pick<RampPeriod, 'label' | 'startDate' | 'endDate' | 'periodChange'>
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden pr-2">
      <span className="shrink-0 text-[13px] font-semibold text-brand-navy">{period.label}</span>
      <div className="flex min-w-0 items-center gap-1 overflow-hidden text-[12px] text-brand-fog">
        <Calendar size={14} className="shrink-0 text-brand-mist" />
        <span className="whitespace-nowrap">{period.startDate}</span>
        <span>to</span>
        <span className="whitespace-nowrap">{period.endDate}</span>
      </div>
      {period.periodChange === 'added' && (
        <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          New
        </span>
      )}
    </div>
  )
}

const DEFAULT_SOURCE_NAME = 'Apex platform - growth services'

function sourceNameFromGroups(groups: AllocationGroup[]) {
  return groups[0]?.sources[0]?.name ?? DEFAULT_SOURCE_NAME
}

function createAllocationFromCatalog(
  catalogItem: CatalogEntitlement,
  sourceName: string
): AllocationGroup {
  const id = `alloc-new-${catalogItem.id}-${Date.now()}`
  return {
    id,
    feature: catalogItem.feature,
    units: catalogItem.defaultUnits,
    kind: catalogItem.kind,
    sources: [
      {
        id: `${id}-s1`,
        name: sourceName,
        units: catalogItem.defaultUnits,
        frequency: catalogItem.frequency,
      },
    ],
  }
}

function EntitlementPopover({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CatalogEntitlement) => void
  anchorRef: RefObject<HTMLElement | null>
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) setSearchQuery('')
  }, [isOpen])

  const filteredItems = entitlementCatalog.filter((item) =>
    item.feature.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnchoredMenu
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      className="w-[400px] rounded-lg border border-neutral-200 bg-white shadow-lg"
    >
      <div className="border-b border-neutral-200 p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-mist" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entitlements..."
            className="w-full rounded-lg bg-neutral-100 py-2 pl-9 pr-8 text-[13px] text-brand-navy outline-none placeholder:text-brand-mist focus:bg-neutral-50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-brand-mist hover:bg-neutral-200 hover:text-brand-navy"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-brand-fog">No entitlements found</div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="group/opt flex w-full cursor-pointer flex-col gap-0.5 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-navy"
            >
              <span className="text-[14px] font-medium text-brand-navy group-hover/opt:text-white">
                {item.feature}
              </span>
              <span className="text-[12px] text-brand-fog group-hover/opt:text-white/70">
                {item.kind === 'usage' ? 'Usage' : 'Entitlement'} · {item.defaultUnits} units · {item.frequency}
              </span>
            </button>
          ))
        )}
      </div>
    </AnchoredMenu>
  )
}

function AddEntitlementButton({
  onSelect,
}: {
  onSelect: (item: CatalogEntitlement) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CirclePlus size={16} className="text-blue-700" />
        Add entitlement
      </button>
      <EntitlementPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(item) => {
          onSelect(item)
          setIsOpen(false)
        }}
        anchorRef={buttonRef}
      />
    </div>
  )
}

export function AllocationTable({ items: initialItems, periods }: AllocationTableProps) {
  const [flatItems, setFlatItems] = useState(initialItems)
  const [periodItems, setPeriodItems] = useState<Record<string, AllocationGroup[]>>(() => {
    if (!periods?.length) return {}
    return Object.fromEntries(periods.map((period) => [period.id, cloneGroups(initialItems, period.id)]))
  })
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    () => new Set(periods?.map((period) => period.id) ?? [])
  )

  useEffect(() => {
    setFlatItems(initialItems)
    if (periods?.length) {
      setPeriodItems(
        Object.fromEntries(periods.map((period) => [period.id, cloneGroups(initialItems, period.id)]))
      )
    }
  }, [initialItems, periods])

  const togglePeriod = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const patchGroup = (
    list: AllocationGroup[],
    groupId: string,
    sourceId: string,
    patch: Partial<AllocationGroup['sources'][number]>
  ) =>
    list.map((group) =>
      group.id !== groupId
        ? group
        : {
            ...group,
            sources: group.sources.map((source) =>
              source.id === sourceId ? { ...source, ...patch } : source
            ),
          }
    )

  const updateUnits = (groupId: string, sourceId: string, next: string, periodId?: string) => {
    if (periodId) {
      setPeriodItems((prev) => ({
        ...prev,
        [periodId]: patchGroup(prev[periodId] ?? [], groupId, sourceId, { units: next }),
      }))
      return
    }
    setFlatItems((prev) => patchGroup(prev, groupId, sourceId, { units: next }))
  }

  const handleAddEntitlement = (catalogItem: CatalogEntitlement, periodId?: string) => {
    if (periodId) {
      setPeriodItems((prev) => {
        const groups = prev[periodId] ?? []
        return {
          ...prev,
          [periodId]: [...groups, createAllocationFromCatalog(catalogItem, sourceNameFromGroups(groups))],
        }
      })
      return
    }
    setFlatItems((prev) => [
      ...prev,
      createAllocationFromCatalog(catalogItem, sourceNameFromGroups(prev)),
    ])
  }

  if (periods && periods.length > 0) {
    return (
      <div className="w-full">
        {periods.map((period, index) => {
          const isExpanded = expandedPeriods.has(period.id)
          const groups = periodItems[period.id] ?? []
          const isLast = index === periods.length - 1
          const marginBottom = isLast ? 8 : isExpanded ? 48 : 28

          return (
            <div
              key={period.id}
              className={cn(!isExpanded && 'border-b border-neutral-200')}
              style={{ marginBottom }}
            >
              {isExpanded ? (
                <>
                  <AllocationColumnHeaders
                    columns={PERIOD_COLS}
                    period={period}
                    onToggle={() => togglePeriod(period.id)}
                  />
                  <AllocationGroups
                    items={groups}
                    columns={PERIOD_COLS}
                    edgePadding={PERIOD_EDGE}
                    onUpdateUnits={(groupId, sourceId, next) =>
                      updateUnits(groupId, sourceId, next, period.id)
                    }
                  />
                  <div className="flex items-center border-t border-neutral-200 py-2 pl-1">
                    <AddEntitlementButton
                      onSelect={(catalogItem) => handleAddEntitlement(catalogItem, period.id)}
                    />
                  </div>
                </>
              ) : (
                <div
                  onClick={() => togglePeriod(period.id)}
                  className="flex w-full cursor-pointer items-center py-3 pl-1 pr-2 transition-colors hover:bg-neutral-50"
                >
                  <PeriodChevron isExpanded={false} onToggle={() => togglePeriod(period.id)} />
                  <PeriodIdentity period={period} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full">
      <AllocationColumnHeaders />
      <AllocationGroups items={flatItems} onUpdateUnits={updateUnits} />
      <div className="flex items-center border-t border-neutral-200 py-2 pl-1">
        <AddEntitlementButton onSelect={(catalogItem) => handleAddEntitlement(catalogItem)} />
      </div>
    </div>
  )
}

/** Header and rows must share this so their column tracks line up. */
const PERIOD_EDGE = 'pl-1 pr-2'
const FLAT_EDGE = 'px-4'

function AllocationColumnHeaders({
  columns = COLS,
  period,
  onToggle,
}: {
  columns?: string
  period?: Pick<RampPeriod, 'label' | 'startDate' | 'endDate' | 'periodChange'>
  onToggle?: () => void
}) {
  return (
    <div
      className={cn(
        'grid items-center border-b border-neutral-200 pb-2',
        period ? PERIOD_EDGE : FLAT_EDGE
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {period && onToggle ? (
        <div className="flex min-w-0 items-center pr-3">
          <PeriodChevron isExpanded onToggle={onToggle} />
          <PeriodIdentity period={period} />
        </div>
      ) : (
        <div className="pr-3 text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
          Entitlement
        </div>
      )}
      <div className="flex min-w-0 items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        <Separator />
        Item
      </div>
      <div className="flex items-center text-[11px] font-normal uppercase tracking-[-0.5px] text-brand-navy">
        <span className="mx-3 w-px shrink-0" aria-hidden />
        {/* Mirrors the row's ramp gutter + count track so “Units” sits over the numbers. */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0" style={{ width: RAMP_ICON_W }} aria-hidden />
          <span className="shrink-0 text-right" style={{ width: UNITS_COUNT_W }}>
            Units
          </span>
        </div>
      </div>
    </div>
  )
}

function AllocationGroups({
  items,
  columns = COLS,
  edgePadding = FLAT_EDGE,
  onUpdateUnits,
}: {
  items: AllocationGroup[]
  columns?: string
  edgePadding?: string
  onUpdateUnits: (groupId: string, sourceId: string, next: string) => void
}) {
  return (
    <>
      {items.map((group, groupIndex) => {
        const isUsage = group.kind === 'usage'
        const sourceCount = Math.max(group.sources.length, 1)
        const isLastGroup = groupIndex === items.length - 1
        const unitLabel = group.unitLabel ?? unitLabelFromFeature(group.feature)

        return (
          <div key={group.id} className={cn(!isLastGroup && 'border-b border-neutral-200')}>
            <div
              className={cn('grid items-stretch', edgePadding)}
              style={{ gridTemplateColumns: columns }}
            >
              <div
                className="flex min-w-0 items-center self-stretch pr-3"
                style={{ gridRow: `1 / span ${sourceCount}` }}
              >
                <EntitlementNameButton name={group.feature} isUsage={isUsage} />
              </div>

              {group.sources.map((source, index) => {
                const showItemRule = index < group.sources.length - 1

                return (
                  <div key={source.id} className="contents">
                    <div
                      className={cn(
                        'flex min-w-0 items-center py-1.5',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <span className="min-w-0 truncate text-[14px] text-brand-navy">
                        {source.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-end py-1.5 text-[14px] tabular-nums text-brand-navy',
                        showItemRule && 'border-b border-neutral-100'
                      )}
                    >
                      <Separator />
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span
                          className="flex shrink-0 items-center justify-end"
                          style={{ width: RAMP_ICON_W }}
                        >
                          {source.rampUnitsChange ? (
                            <TrendingUp
                              size={12}
                              strokeWidth={2}
                              className="shrink-0 text-green-700"
                              aria-label="Units increased from previous period"
                            />
                          ) : null}
                        </span>
                        <div
                          className="flex shrink-0 items-center justify-end"
                          style={{ minWidth: UNITS_COUNT_W }}
                        >
                          <UnitsField
                            value={source.units}
                            onCommit={(next) => onUpdateUnits(group.id, source.id, next)}
                          />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] text-brand-fog">
                          {unitLabel}
                          {frequencySuffix(source.frequency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
