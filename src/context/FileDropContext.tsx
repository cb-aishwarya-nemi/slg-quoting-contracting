import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

export interface ProcessingFile {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'uploaded' | 'processing' | 'complete' | 'error'
  /** Temporary rows in My tasks only for multi-file uploads */
  showInTaskTable: boolean
}

export interface WorkbenchItem {
  id: number
  /** Human-readable task identifier, e.g. "TSK-2026-0153" */
  taskId?: string
  /** Task category, e.g. "Contract Ingestion" */
  taskType: string
  /** Short task name, e.g. "New deal", "Early renewal" */
  taskName?: string
  customer: string
  subject: string
  severity: string
  detail: string
  createdAt: Date
  isNew?: boolean
  // Contract ingestion specific fields
  contractId?: string
  startDate?: Date
  tcv?: string
  status?: string
  owner?: string
}

interface FileDropContextValue {
  isDragging: boolean
  setIsDragging: (value: boolean) => void
  processingFiles: ProcessingFile[]
  addProcessingFile: (file: File, options?: { batchSize?: number }) => void
  removeProcessingFile: (fileId: string) => void
  workbenchItems: WorkbenchItem[]
  hasNewItem: boolean
  clearNewItemFlag: () => void
  clearItemNewFlag: (itemId: number) => void
  shouldOpenModal: boolean
  setShouldOpenModal: (value: boolean) => void
}

const FileDropContext = createContext<FileDropContextValue | null>(null)

// Helper to create dates relative to now
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

// Initial workbench items (Pioneer Systems included for prototype)
const INITIAL_TASKS: WorkbenchItem[] = [
  // Pioneer Systems - for Customer Link Modal prototype
  {
    id: 100,
    taskId: "TSK-2026-0153",
    taskType: "Contract Ingestion",
    taskName: "New deal",
    customer: "Pioneer Systems",
    subject: "PioneerSystems_NewBusiness_Platform_2026.docx — Growth tier, 50 seats",
    severity: "High",
    detail: "New Business · Contract Upload",
    createdAt: new Date(),
    isNew: false, // Set to false initially for prototype
    contractId: "CT-2026-0153",
    startDate: new Date(),
    tcv: "$48,000",
    status: "Ready for review",
    owner: "You",
  },
  {
    id: 1,
    taskId: "TSK-2026-0154",
    taskType: "Contract Ingestion",
    taskName: "Early renewal",
    customer: "Verdant Health",
    subject: "VerdantHealth_EarlyRenewal_2026.pdf — 3-year Enterprise renewal, $240K ARR",
    severity: "Critical",
    detail: "Early Renewal · PDF Upload",
    createdAt: daysAgo(1),
    contractId: "CT-2026-0154",
    startDate: daysAgo(1),
    tcv: "$240,000",
    status: "In review",
    owner: "Marcus Webb",
  },
  {
    id: 2,
    taskType: "Collection - Payment overdue",
    customer: "Ridgeline Manufacturing",
    subject: "Invoice #INV-2024-0892 — 45 days past due, $18,500",
    severity: "Critical",
    detail: "Collections · Escalation required",
    createdAt: daysAgo(2),
  },
  {
    id: 3,
    taskId: "TSK-2026-0151",
    taskType: "Contract Ingestion",
    taskName: "New deal",
    customer: "Zenith Analytics Inc.",
    subject: "ZenithAnalytics_NewBusiness_Contract_2026.pdf — Platform license + Implementation",
    severity: "High",
    detail: "New Business · PDF Upload",
    createdAt: daysAgo(3),
    contractId: "CT-2026-0151",
    startDate: daysAgo(3),
    tcv: "$85,000",
    status: "Blocked",
    owner: "Priya Malhotra",
  },
  {
    id: 4,
    taskType: "Quote - Pending review",
    customer: "Apex Dynamics",
    subject: "Draft quote Q-2026-1847 — Multi-year discount approval needed",
    severity: "High",
    detail: "Quote · Awaiting manager approval",
    createdAt: daysAgo(4),
  },
  {
    id: 5,
    taskType: "Contract expired - Add extension",
    customer: "Northlane Labs",
    subject: "NorthlaneLabs_LateRenewal_Commercial_2026.pdf — Renewal overdue, requires closeout",
    severity: "High",
    detail: "Contract about to expire — choose how to proceed",
    createdAt: daysAgo(7),
  },
  {
    id: 6,
    taskType: "Amendment - Review terms",
    customer: "Bluestone Partners",
    subject: "Addendum to MSA — Additional 25 seats, mid-cycle upgrade",
    severity: "Medium",
    detail: "Amendment · Legal review complete",
    createdAt: daysAgo(5),
  },
  {
    id: 7,
    taskType: "Collection - Reminder due",
    customer: "Cascade Networks",
    subject: "Invoice #INV-2024-1203 — Payment reminder, 15 days overdue",
    severity: "Medium",
    detail: "Collections · Send follow-up",
    createdAt: daysAgo(6),
  },
  {
    id: 8,
    taskType: "Quote - Customer responded",
    customer: "Ironclad Security",
    subject: "Quote Q-2026-1652 revised — Customer requesting 10% volume discount",
    severity: "Medium",
    detail: "Quote · Negotiation in progress",
    createdAt: daysAgo(8),
  },
  {
    id: 9,
    taskType: "Renewal - 60 day notice",
    customer: "Momentum Retail",
    subject: "Annual subscription renewal due Aug 15 — $85K ARR, auto-renew off",
    severity: "Medium",
    detail: "Renewal · Outreach recommended",
    createdAt: daysAgo(9),
  },
  {
    id: 10,
    taskType: "Contract - Signature pending",
    customer: "Vector Logistics",
    subject: "Executed contract awaiting countersignature — Deal closing Q2",
    severity: "Low",
    detail: "Contract · DocuSign sent",
    createdAt: daysAgo(10),
  },
  {
    id: 11,
    taskType: "Quote - Draft saved",
    customer: "Prism Technologies",
    subject: "Draft quote Q-2026-1901 — Starter tier, 10 seats, awaiting pricing confirmation",
    severity: "Low",
    detail: "Quote · Incomplete draft",
    createdAt: daysAgo(11),
  },
  {
    id: 12,
    taskType: "Renewal - Auto-renew scheduled",
    customer: "Summit Financial",
    subject: "Contract auto-renews Sep 1 — Review terms before renewal",
    severity: "Low",
    detail: "Renewal · No action required",
    createdAt: daysAgo(14),
  },
  {
    id: 13,
    taskType: "Collection - Payment received",
    customer: "Horizon Media Group",
    subject: "Invoice #INV-2024-0756 — Partial payment $12,000 of $24,000 received",
    severity: "Low",
    detail: "Collections · Balance outstanding",
    createdAt: daysAgo(12),
  },
  {
    id: 14,
    taskType: "Amendment - Approved",
    customer: "Keystone Industries",
    subject: "Service upgrade amendment — Approved, awaiting activation",
    severity: "Low",
    detail: "Amendment · Ready to execute",
    createdAt: daysAgo(15),
  },
  {
    id: 15,
    taskType: "Collection - Payment overdue",
    customer: "Stellar Biotech",
    subject: "Invoice #INV-2024-1456 — 60 days past due, $32,000",
    severity: "Critical",
    detail: "Collections · Final notice sent",
    createdAt: daysAgo(3),
  },
  {
    id: 16,
    taskId: "TSK-2026-0155",
    taskType: "Contract Ingestion",
    taskName: "New deal",
    customer: "Quantum Innovations",
    subject: "QuantumInnovations_Enterprise_2026.pdf — Full platform, 200 seats",
    severity: "Critical",
    detail: "New Business · High-value deal",
    createdAt: daysAgo(1),
    contractId: "CT-2026-0155",
    startDate: daysAgo(1),
    tcv: "$420,000",
    status: "Pending approval",
    owner: "You",
  },
  {
    id: 17,
    taskType: "Quote - Pending review",
    customer: "Atlas Cloud Services",
    subject: "Draft quote Q-2026-2103 — Custom pricing tier approval",
    severity: "High",
    detail: "Quote · VP approval required",
    createdAt: daysAgo(2),
  },
  {
    id: 18,
    taskType: "Contract expired - Add extension",
    customer: "Beacon Healthcare",
    subject: "BeaconHealthcare_Renewal_2026.pdf — Contract lapsed, customer requesting extension",
    severity: "High",
    detail: "Contract · Grace period active",
    createdAt: daysAgo(4),
  },
  {
    id: 19,
    taskId: "TSK-2026-0150",
    taskType: "Contract Ingestion",
    taskName: "Early renewal",
    customer: "Nexus Payments",
    subject: "NexusPayments_EarlyRenewal_2026.pdf — 2-year renewal, $180K ARR",
    severity: "High",
    detail: "Early Renewal · Upsell opportunity",
    createdAt: daysAgo(5),
    contractId: "CT-2026-0150",
    startDate: daysAgo(5),
    tcv: "$180,000",
    status: "In review",
    owner: "Marcus Webb",
  },
  {
    id: 20,
    taskType: "Collection - Reminder due",
    customer: "Orion Aerospace",
    subject: "Invoice #INV-2024-1589 — Second reminder, 30 days overdue",
    severity: "Medium",
    detail: "Collections · Escalate to account manager",
    createdAt: daysAgo(7),
  },
  {
    id: 21,
    taskType: "Amendment - Review terms",
    customer: "Fusion Energy Corp",
    subject: "Addendum to SLA — Premium support tier upgrade",
    severity: "Medium",
    detail: "Amendment · Pending legal review",
    createdAt: daysAgo(8),
  },
  {
    id: 22,
    taskType: "Quote - Customer responded",
    customer: "Pinnacle Consulting",
    subject: "Quote Q-2026-1788 — Counter-offer received, $95K deal",
    severity: "Medium",
    detail: "Quote · Review counter-terms",
    createdAt: daysAgo(6),
  },
  {
    id: 23,
    taskType: "Renewal - 60 day notice",
    customer: "Cobalt Mining Co",
    subject: "Annual license renewal due Jul 30 — $120K ARR, expansion discussion",
    severity: "Medium",
    detail: "Renewal · Schedule review call",
    createdAt: daysAgo(10),
  },
  {
    id: 24,
    taskType: "Contract - Signature pending",
    customer: "Evergreen Solutions",
    subject: "MSA v2.0 awaiting final signature — Legal approved",
    severity: "Low",
    detail: "Contract · Follow up with signatory",
    createdAt: daysAgo(11),
  },
  {
    id: 25,
    taskType: "Quote - Draft saved",
    customer: "Titan Manufacturing",
    subject: "Draft quote Q-2026-2045 — Standard tier, 25 seats",
    severity: "Low",
    detail: "Quote · Awaiting customer confirmation",
    createdAt: daysAgo(13),
  },
  {
    id: 26,
    taskType: "Renewal - Auto-renew scheduled",
    customer: "Pacific Digital",
    subject: "Contract auto-renews Oct 15 — No changes requested",
    severity: "Low",
    detail: "Renewal · Monitoring",
    createdAt: daysAgo(16),
  },
  {
    id: 27,
    taskType: "Collection - Payment received",
    customer: "Sterling Ventures",
    subject: "Invoice #INV-2024-0934 — Full payment $45,000 received",
    severity: "Low",
    detail: "Collections · Close ticket",
    createdAt: daysAgo(14),
  },
  {
    id: 28,
    taskType: "Amendment - Approved",
    customer: "Redwood Analytics",
    subject: "Data retention amendment — Compliance update approved",
    severity: "Low",
    detail: "Amendment · Schedule implementation",
    createdAt: daysAgo(17),
  },
]

// Factory function to create Pioneer Systems item with current timestamp
const createPioneerSystemsItem = (): WorkbenchItem => ({
  id: 100,
  taskId: "TSK-2026-0153",
  taskType: "Contract Ingestion",
  taskName: "New deal",
  customer: "Pioneer Systems",
  subject: "PioneerSystems_NewBusiness_Platform_2026.docx — Growth tier, 50 seats",
  severity: "High",
  detail: "New Business · Contract Upload",
  createdAt: new Date(),
  isNew: true,
  contractId: "CT-2026-0153",
  startDate: new Date(),
  tcv: "$48,000",
  status: "Ready for review",
  owner: "You",
})

export function FileDropProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])
  const [workbenchItems, setWorkbenchItems] = useState<WorkbenchItem[]>(INITIAL_TASKS)
  const [hasNewItem, setHasNewItem] = useState(false)
  const [shouldOpenModal, setShouldOpenModal] = useState(false)
  const extractionQueueRef = useRef<string[]>([])
  const isExtractingRef = useRef(false)
  const processingFilesRef = useRef<ProcessingFile[]>([])

  const promoteFileToWorkbench = useCallback(() => {
    setWorkbenchItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.customer === 'Pioneer Systems')

      if (existingIndex !== -1) {
        const updatedItems = [...prev]
        const existingItem = updatedItems[existingIndex]
        updatedItems.splice(existingIndex, 1)
        return [
          {
            ...existingItem,
            isNew: true,
            createdAt: new Date(),
          },
          ...updatedItems,
        ]
      }

      return [createPioneerSystemsItem(), ...prev]
    })
    setHasNewItem(true)
  }, [])

  const processNextExtraction = useCallback(() => {
    if (isExtractingRef.current) return
    const nextId = extractionQueueRef.current[0]
    if (!nextId) return

    const latest = processingFilesRef.current
    // Wait until every file has finished uploading so the pill and table
    // enter "Extracting" from the same state update.
    if (latest.some((f) => f.status === 'uploading')) return

    const nextFile = latest.find((f) => f.id === nextId)
    if (!nextFile || nextFile.status !== 'uploaded') return

    extractionQueueRef.current.shift()
    isExtractingRef.current = true

    const nextFiles = latest.map((f) =>
      f.id === nextId ? { ...f, status: 'processing' as const } : f
    )
    processingFilesRef.current = nextFiles
    setProcessingFiles(nextFiles)

    const EXTRACTION_MS = 3500
    setTimeout(() => {
      const finished = processingFilesRef.current.find((f) => f.id === nextId)
      const after = processingFilesRef.current.map((f) =>
        f.id === nextId ? { ...f, status: 'complete' as const } : f
      )
      processingFilesRef.current = after
      setProcessingFiles(after)
      promoteFileToWorkbench()
      // Single-file uploads open the customer link modal (multi-file stays on the table)
      if (finished && !finished.showInTaskTable) {
        setShouldOpenModal(true)
      }
      isExtractingRef.current = false
      processNextExtraction()
    }, EXTRACTION_MS)
  }, [promoteFileToWorkbench])

  const enqueueExtraction = useCallback(
    (fileId: string) => {
      extractionQueueRef.current.push(fileId)
      processNextExtraction()
    },
    [processNextExtraction]
  )

  const addProcessingFile = useCallback(
    (file: File, options?: { batchSize?: number }) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const processingFile: ProcessingFile = {
        id: fileId,
        name: file.name,
        progress: 0,
        status: 'uploading',
        showInTaskTable: (options?.batchSize ?? 1) >= 2,
      }

      const withNew = [...processingFilesRef.current, processingFile]
      processingFilesRef.current = withNew
      setProcessingFiles(withNew)

      // Simulate upload progress — each file uploads independently
      let progress = 0
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 15 + 5
        if (progress >= 100) {
          progress = 100
          clearInterval(uploadInterval)

          const uploaded = processingFilesRef.current.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: 'uploaded' as const } : f
          )
          processingFilesRef.current = uploaded
          setProcessingFiles(uploaded)
          enqueueExtraction(fileId)
        } else {
          const progressed = processingFilesRef.current.map((f) =>
            f.id === fileId ? { ...f, progress: Math.min(progress, 99) } : f
          )
          processingFilesRef.current = progressed
          setProcessingFiles(progressed)
        }
      }, 200)
    },
    [enqueueExtraction]
  )

  const clearNewItemFlag = useCallback(() => {
    setHasNewItem(false)
    setWorkbenchItems((prev) => prev.map((item) => ({ ...item, isNew: false })))
  }, [])

  const clearItemNewFlag = useCallback(
    (itemId: number) => {
      setWorkbenchItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isNew: false } : item))
      )
      setHasNewItem((prev) => {
        const hasOtherNew = prev && workbenchItems.some((item) => item.id !== itemId && item.isNew)
        return hasOtherNew
      })
    },
    [workbenchItems]
  )

  const removeProcessingFile = useCallback((fileId: string) => {
    const next = processingFilesRef.current.filter((f) => f.id !== fileId)
    processingFilesRef.current = next
    setProcessingFiles(next)
    extractionQueueRef.current = extractionQueueRef.current.filter((id) => id !== fileId)
  }, [])

  return (
    <FileDropContext.Provider
      value={{
        isDragging,
        setIsDragging,
        processingFiles,
        addProcessingFile,
        removeProcessingFile,
        workbenchItems,
        hasNewItem,
        clearNewItemFlag,
        clearItemNewFlag,
        shouldOpenModal,
        setShouldOpenModal,
      }}
    >
      {children}
    </FileDropContext.Provider>
  )
}

export function useFileDrop() {
  const context = useContext(FileDropContext)
  if (!context) {
    throw new Error('useFileDrop must be used within a FileDropProvider')
  }
  return context
}
