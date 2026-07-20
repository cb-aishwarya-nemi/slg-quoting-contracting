import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface FieldEditRecord {
  id: string
  fieldKey: string
  sectionId: string
  sectionLabel: string
  fieldLabel: string
  previousValue: string
  newValue: string
  editedAt: number
}

export interface FieldEditMeta {
  sectionId: string
  sectionLabel: string
  fieldLabel: string
}

function makeFieldKey(sectionId: string, fieldLabel: string) {
  return `${sectionId}:${fieldLabel}`
}

/** Empty / missing values are first fills, not edits. */
function hasPreviousValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed !== '—' && trimmed !== '-'
}

function formatEditTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const SEED_EDITS: FieldEditRecord[] = [
  {
    id: 'seed-1',
    fieldKey: makeFieldKey('terms', 'Payment terms'),
    sectionId: 'terms',
    sectionLabel: 'Terms and billing',
    fieldLabel: 'Payment terms',
    previousValue: 'Net 45',
    newValue: 'Net 30',
    editedAt: Date.now() - 24 * 60 * 60_000,
  },
  {
    id: 'seed-2',
    fieldKey: makeFieldKey('terms', 'Payment terms'),
    sectionId: 'terms',
    sectionLabel: 'Terms and billing',
    fieldLabel: 'Payment terms',
    previousValue: 'Net 60',
    newValue: 'Net 45',
    editedAt: Date.now() - 2 * 60 * 60_000,
  },
  {
    id: 'seed-3',
    fieldKey: makeFieldKey('account', 'Email'),
    sectionId: 'account',
    sectionLabel: 'Account',
    fieldLabel: 'Email',
    previousValue: 'alex@pioneer.com',
    newValue: 'alex.nguyen@pioneersystems.com',
    editedAt: Date.now() - 45 * 60_000,
  },
]

export interface FieldEditEvent {
  sectionId: string
  sectionLabel: string
  fieldLabel: string
  previousValue: string
  newValue: string
}

interface FieldEditHistoryContextValue {
  recordEdit: (
    sectionId: string,
    meta: Omit<FieldEditMeta, 'sectionId'>,
    previousValue: string,
    newValue: string
  ) => void
  getEdits: (sectionId: string, fieldLabel: string) => FieldEditRecord[]
  hasEdits: (sectionId: string, fieldLabel: string) => boolean
  /** True when the user has changed this field in the current session */
  isFieldEdited: (sectionId: string, fieldLabel: string) => boolean
  editedFieldCount: number
  editCount: number
  isDownstreamRefreshing: boolean
  downstreamUpdatedAt: number | null
  refreshDownstream: () => void
  formatEditTime: (timestamp: number) => string
}

const FieldEditHistoryContext = createContext<FieldEditHistoryContextValue | null>(null)

export function FieldEditHistoryProvider({
  children,
  onFieldEdit,
}: {
  children: ReactNode
  /** Fired on every committed field change (including first fills). */
  onFieldEdit?: (event: FieldEditEvent) => void
}) {
  const onFieldEditRef = useRef(onFieldEdit)
  onFieldEditRef.current = onFieldEdit
  const [isDownstreamRefreshing, setIsDownstreamRefreshing] = useState(false)
  const [downstreamUpdatedAt, setDownstreamUpdatedAt] = useState<number | null>(null)
  const downstreamRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editsByField, setEditsByField] = useState<Record<string, FieldEditRecord[]>>(() => {
    const grouped: Record<string, FieldEditRecord[]> = {}
    for (const edit of SEED_EDITS) {
      if (!grouped[edit.fieldKey]) grouped[edit.fieldKey] = []
      grouped[edit.fieldKey].push(edit)
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => b.editedAt - a.editedAt)
    }
    return grouped
  })
  /** Session-only: fields the user has changed (excludes seed history) */
  const [editedFieldKeys, setEditedFieldKeys] = useState<Set<string>>(() => new Set())

  const triggerDownstreamRefresh = useCallback(() => {
    setIsDownstreamRefreshing(true)
    setDownstreamUpdatedAt(null)
    if (downstreamRefreshTimerRef.current) {
      clearTimeout(downstreamRefreshTimerRef.current)
    }
    downstreamRefreshTimerRef.current = setTimeout(() => {
      setIsDownstreamRefreshing(false)
      setDownstreamUpdatedAt(Date.now())
      downstreamRefreshTimerRef.current = null
    }, 1500)
  }, [])

  useEffect(() => {
    return () => {
      if (downstreamRefreshTimerRef.current) {
        clearTimeout(downstreamRefreshTimerRef.current)
      }
    }
  }, [])

  const recordEdit = useCallback(
    (
      sectionId: string,
      meta: Omit<FieldEditMeta, 'sectionId'>,
      previousValue: string,
      newValue: string
    ) => {
      if (previousValue === newValue) return

      const fieldKey = makeFieldKey(sectionId, meta.fieldLabel)

      onFieldEditRef.current?.({
        sectionId,
        sectionLabel: meta.sectionLabel,
        fieldLabel: meta.fieldLabel,
        previousValue,
        newValue,
      })

      setEditedFieldKeys((prev) => {
        if (prev.has(fieldKey)) return prev
        const next = new Set(prev)
        next.add(fieldKey)
        return next
      })

      // Empty / missing values are first fills — notify + badge only, don't store edit history
      if (!hasPreviousValue(previousValue)) return

      const record: FieldEditRecord = {
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fieldKey,
        sectionId,
        sectionLabel: meta.sectionLabel,
        fieldLabel: meta.fieldLabel,
        previousValue,
        newValue,
        editedAt: Date.now(),
      }

      setEditsByField((prev) => {
        const existing = prev[fieldKey] ?? []
        return {
          ...prev,
          [fieldKey]: [record, ...existing],
        }
      })
      triggerDownstreamRefresh()
    },
    [triggerDownstreamRefresh]
  )

  const getEdits = useCallback(
    (sectionId: string, fieldLabel: string) => {
      const fieldKey = makeFieldKey(sectionId, fieldLabel)
      return editsByField[fieldKey] ?? []
    },
    [editsByField]
  )

  const hasEdits = useCallback(
    (sectionId: string, fieldLabel: string) => {
      const fieldKey = makeFieldKey(sectionId, fieldLabel)
      return (editsByField[fieldKey]?.length ?? 0) > 0
    },
    [editsByField]
  )

  const isFieldEdited = useCallback(
    (sectionId: string, fieldLabel: string) => {
      return editedFieldKeys.has(makeFieldKey(sectionId, fieldLabel))
    },
    [editedFieldKeys]
  )

  const editedFieldCount = useMemo(
    () => Object.values(editsByField).filter((records) => records.length > 0).length,
    [editsByField]
  )

  const editCount = useMemo(
    () =>
      Object.values(editsByField)
        .flat()
        .filter((record) => !record.id.startsWith('seed-')).length,
    [editsByField]
  )

  const value = useMemo(
    () => ({
      recordEdit,
      getEdits,
      hasEdits,
      isFieldEdited,
      editedFieldCount,
      editCount,
      isDownstreamRefreshing,
      downstreamUpdatedAt,
      refreshDownstream: triggerDownstreamRefresh,
      formatEditTime,
    }),
    [recordEdit, getEdits, hasEdits, isFieldEdited, editedFieldCount, editCount, isDownstreamRefreshing, downstreamUpdatedAt, triggerDownstreamRefresh]
  )

  return (
    <FieldEditHistoryContext.Provider value={value}>{children}</FieldEditHistoryContext.Provider>
  )
}

export function useFieldEditHistory() {
  const context = useContext(FieldEditHistoryContext)
  if (!context) {
    throw new Error('useFieldEditHistory must be used within FieldEditHistoryProvider')
  }
  return context
}

export function useOptionalFieldEditHistory() {
  return useContext(FieldEditHistoryContext)
}

export function formatFieldEditCommentBody(event: FieldEditEvent): string {
  const sep = ' · '
  const sepIdx = event.fieldLabel.lastIndexOf(sep)
  const fieldLabel = sepIdx >= 0 ? event.fieldLabel.slice(sepIdx + sep.length) : event.fieldLabel
  if (hasPreviousValue(event.previousValue)) {
    return `Updated ${fieldLabel} from "${event.previousValue}" to "${event.newValue}"`
  }
  return `Set ${fieldLabel} to "${event.newValue}"`
}
