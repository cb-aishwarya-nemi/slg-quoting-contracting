// ─────────────────────────────────────────────────────────────────────────────
// Invoice Details mock data — Pioneer Systems invoice after contract approval
// ─────────────────────────────────────────────────────────────────────────────

export interface InvoiceMetric {
  label: string
  value: string
  variant?: 'status' | 'warning' | 'default'
}

export interface InvoiceLineItem {
  id: string
  name: string
  quantity: string
  frequency: string
  unitPrice: string
  totalPrice: string
}

export interface InvoiceDetail {
  label: string
  value: string
  variant?: 'warning' | 'default'
}

export interface BillingInfo {
  label: string
  value: string
}

export interface ActivityItem {
  id: string
  action: string
  actor: string
  timestamp: string
  detail?: string
}

export interface InvoiceComment {
  id: string
  author: string
  initials: string
  isAI?: boolean
  timestamp: string
  body: string
  actions?: { label: string; primary?: boolean }[]
}

export const invoiceData = {
  invoiceId: 'INV-2026-9584',
  invoiceValue: '$126,000',
  customerName: 'Pioneer Systems',

  topMetrics: [
    { label: 'Status', value: 'Pending Approval', variant: 'status' },
    { label: 'Invoice Date', value: 'Jun 15, 2026' },
    { label: 'Due Date', value: 'Jul 15, 2026' },
    { label: 'Total', value: '$126,000' },
  ] as InvoiceMetric[],

  bottomMetrics: [
    { label: 'Balance Due', value: '$126,000' },
    { label: 'Currency', value: 'USD' },
    { label: 'Payment Terms', value: 'Net 30' },
    { label: 'Billing Period', value: '—' },
  ] as InvoiceMetric[],

  details: [
    { label: 'Invoice ID', value: 'INV-2026-9584' },
    { label: 'Contract', value: 'CON-2026-9584' },
    { label: 'Bill-to Contact', value: '—' },
    { label: 'PO Number', value: 'Not provided', variant: 'warning' },
    { label: 'Tax Total', value: '—' },
    { label: 'Owner', value: 'System' },
  ] as InvoiceDetail[],

  lineItems: [
    {
      id: 'li-1',
      name: 'Apex Platform – Growth',
      quantity: '50',
      frequency: 'Yearly',
      unitPrice: '$2,400.00',
      totalPrice: '$108,000.00',
    },
    {
      id: 'li-2',
      name: 'Implementation Services',
      quantity: '01',
      frequency: 'One-time',
      unitPrice: '$18,000.00',
      totalPrice: '$18,000.00',
    },
  ] as InvoiceLineItem[],

  lineItemsTotal: '$126,000.00',

  billingBasis: [
    { label: 'Source Contract', value: 'CON-2026-9584' },
    { label: 'Contract Term', value: '12 months' },
    { label: 'Billing Frequency', value: 'Annual, billed upfront' },
    { label: 'Co-term Behavior', value: 'Align' },
    { label: 'Min Annual Commit', value: '$150,000' },
    { label: 'Prepaid Credit Balance', value: '$0 / $0' },
  ] as BillingInfo[],

  activity: [
    {
      id: 'act-1',
      action: 'Invoice generated',
      actor: 'System',
      timestamp: 'Jun 15, 2026',
      detail: 'Amount: $126,000',
    },
  ] as ActivityItem[],

  comments: [
    {
      id: 'c-1',
      author: 'Apex AI',
      initials: 'AI',
      isAI: true,
      timestamp: 'Just now',
      body: 'This invoice is pending manager approval. The approval request was sent to Sarah Chen (Finance Director). Average approval time is 2-3 business days.',
      actions: [
        { label: 'Send reminder', primary: true },
        { label: 'View approval chain' },
      ],
    },
  ] as InvoiceComment[],
}

export type InvoiceData = typeof invoiceData
