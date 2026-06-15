// ─────────────────────────────────────────────────────────────────────────────
// All Invoices list mock data — Pioneer Systems
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Cancelled'

export interface InvoiceListItem {
  id: string
  invoiceId: string
  status: InvoiceStatus
  type: 'Subscription' | 'One-time' | 'Usage'
  amount: string
  balance: string
  invoiceDate: string
  dueDate: string
  paidDate?: string
  contract: string
}

export interface InvoiceListStat {
  value: string
  label: string
}

export const invoiceListData = {
  customerName: 'Pioneer Systems',

  stats: [
    { value: '$126,000', label: 'Total outstanding' },
    { value: '$0', label: 'Overdue' },
    { value: '3', label: 'Invoices this quarter' },
    { value: '$89,500', label: 'Paid this quarter' },
    { value: '18 days', label: 'Avg. days to pay' },
  ] as InvoiceListStat[],

  invoices: [
    {
      id: 'inv-1',
      invoiceId: 'INV-2026-9584',
      status: 'Pending',
      type: 'Subscription',
      amount: '$126,000.00',
      balance: '$126,000.00',
      invoiceDate: 'Jun 15, 2026',
      dueDate: 'Jul 15, 2026',
      contract: 'CON-2026-9584',
    },
    {
      id: 'inv-2',
      invoiceId: 'INV-2026-8847',
      status: 'Paid',
      type: 'Subscription',
      amount: '$54,000.00',
      balance: '$0.00',
      invoiceDate: 'May 1, 2026',
      dueDate: 'May 30, 2026',
      paidDate: 'May 18, 2026',
      contract: 'CON-2026-8847',
    },
    {
      id: 'inv-3',
      invoiceId: 'INV-2026-7632',
      status: 'Paid',
      type: 'One-time',
      amount: '$35,500.00',
      balance: '$0.00',
      invoiceDate: 'Mar 15, 2026',
      dueDate: 'Apr 15, 2026',
      paidDate: 'Apr 2, 2026',
      contract: 'CON-2026-7632',
    },
    {
      id: 'inv-4',
      invoiceId: 'INV-2025-6421',
      status: 'Paid',
      type: 'Subscription',
      amount: '$48,000.00',
      balance: '$0.00',
      invoiceDate: 'Jan 1, 2026',
      dueDate: 'Jan 31, 2026',
      paidDate: 'Jan 22, 2026',
      contract: 'CON-2025-6421',
    },
    {
      id: 'inv-5',
      invoiceId: 'INV-2025-5890',
      status: 'Paid',
      type: 'Subscription',
      amount: '$42,000.00',
      balance: '$0.00',
      invoiceDate: 'Nov 1, 2025',
      dueDate: 'Nov 30, 2025',
      paidDate: 'Nov 15, 2025',
      contract: 'CON-2025-5890',
    },
    {
      id: 'inv-6',
      invoiceId: 'INV-2025-4723',
      status: 'Paid',
      type: 'Usage',
      amount: '$36,000.00',
      balance: '$0.00',
      invoiceDate: 'Aug 15, 2025',
      dueDate: 'Sep 15, 2025',
      paidDate: 'Sep 8, 2025',
      contract: 'CON-2025-4723',
    },
    {
      id: 'inv-7',
      invoiceId: 'INV-2025-3541',
      status: 'Paid',
      type: 'One-time',
      amount: '$28,500.00',
      balance: '$0.00',
      invoiceDate: 'Jul 1, 2025',
      dueDate: 'Jul 31, 2025',
      paidDate: 'Jul 28, 2025',
      contract: 'CON-2025-3541',
    },
    {
      id: 'inv-8',
      invoiceId: 'INV-2025-2198',
      status: 'Cancelled',
      type: 'Subscription',
      amount: '$12,000.00',
      balance: '$0.00',
      invoiceDate: 'May 15, 2025',
      dueDate: 'Jun 15, 2025',
      contract: 'CON-2025-2198',
    },
  ] as InvoiceListItem[],
}

export const STATUS_STYLES: Record<InvoiceStatus, { bg: string; text: string }> = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Overdue: { bg: 'bg-red-50', text: 'text-red-700' },
  Draft: { bg: 'bg-neutral-100', text: 'text-brand-navy' },
  Cancelled: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

export type InvoiceListData = typeof invoiceListData
