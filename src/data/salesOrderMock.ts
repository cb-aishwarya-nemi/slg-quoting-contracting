// ─────────────────────────────────────────────────────────────────────────────
// Sales Order mock data — derived from the Pioneer Systems contract-processing
// data. Powers the in-frame "Sales Order" tab inside Customer360Page.
// ─────────────────────────────────────────────────────────────────────────────

import { type Comment } from '@/data/contractProcessingMock'
import { type InvoiceStatus } from '@/data/invoiceListMock'

export interface SalesOrderMetric {
  label: string
  value: string
  /** render the value as a blue link (e.g. Source quote) */
  link?: boolean
}

export interface CommittedEntitlement {
  label: string
  value: string
}

export interface SalesOrderProduct {
  id: string
  name: string
  frequency: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

export interface BillingScheduleLine {
  id: string
  billDate: string
  installment: string
  amount: string
  status: 'Paid' | 'Pending' | 'Upcoming'
}

export interface PastInvoiceLine {
  id: string
  invoiceId: string
  date: string
  status: InvoiceStatus
  amount: string
}

export interface SalesOrder {
  id: string
  /** Display id, e.g. "SO-2026-0153" */
  soId: string
  customerName: string
  dealTag: string
  sourceQuote: string
  createdOn: string
  startDate: string
  rampDetails: string
  totalContractValue: string
  avgAnnualValue: string
  contractTerm: string
  renewalAction: string
  committedEntitlements: CommittedEntitlement[]
  products: SalesOrderProduct[]
  upcomingBillingSchedule: BillingScheduleLine[]
  pastInvoices: PastInvoiceLine[]
  /** section-wise comments keyed via linkedSectionId */
  comments: Comment[]
}

const pioneerComments: Comment[] = [
  {
    id: 'so-c-1',
    author: 'Adrian Brody',
    initials: 'AB',
    timestamp: 'Just now',
    body: 'Total contract value reconciles with the signed order form — no adjustments needed.',
    linkedSection: 'Summary',
    linkedSectionId: 'summary',
  },
  {
    id: 'so-c-2',
    author: 'Apex AI',
    initials: 'AI',
    isAI: true,
    timestamp: '2 min ago',
    body: 'Seat cap ramps from 50 to 75 seats in Year 2. Entitlements provisioned accordingly.',
    linkedSection: 'Committed entitlements',
    linkedSectionId: 'entitlements',
  },
  {
    id: 'so-c-3',
    author: 'Adrian Brody',
    initials: 'AB',
    timestamp: '5 min ago',
    body: 'All 5 line items mapped to the catalog. Onboarding & Training confirmed as a one-time charge.',
    linkedSection: 'Products and pricing',
    linkedSectionId: 'products',
  },
  {
    id: 'so-c-4',
    author: 'Adrian Brody',
    initials: 'AB',
    timestamp: '12 min ago',
    body: 'Quarterly billing schedule looks correct — first invoice already issued.',
    linkedSection: 'Upcoming billing schedule',
    linkedSectionId: 'schedule',
  },
]

export const pioneerSalesOrder: SalesOrder = {
  id: 'so-pioneer-0153',
  soId: 'SO-2026-0153',
  customerName: 'Pioneer Systems',
  dealTag: 'NEW DEAL',
  sourceQuote: 'Q-2026-1847',
  createdOn: 'May 1, 2026',
  startDate: 'May 1, 2026',
  rampDetails: '2 ramp periods',
  totalContractValue: '$492,000.00',
  avgAnnualValue: '$164,000.00',
  contractTerm: '36 months',
  renewalAction: 'Manual renewal',

  committedEntitlements: [
    { label: 'Seat cap (ramp)', value: '50 → 75 seats' },
    { label: 'API allowance', value: '5M calls / month' },
    { label: 'Environments', value: '3 sandboxes' },
    { label: 'Support tier', value: 'Premium SLA' },
    { label: 'Features', value: 'Growth tier' },
    { label: 'Overage rate', value: '$0.002 / call' },
  ],

  products: [
    {
      id: 'so-li-1',
      name: 'Apex platform - growth services',
      frequency: 'Yearly',
      quantity: '50',
      unitPrice: '$2,400.00',
      totalPrice: '$120,000.00',
    },
    {
      id: 'so-li-2',
      name: 'Implementation services',
      frequency: 'Yearly',
      quantity: '01',
      unitPrice: '$18,000.00',
      totalPrice: '$18,000.00',
    },
    {
      id: 'so-li-3',
      name: 'Onboarding & Training',
      frequency: 'One-time',
      quantity: '01',
      unitPrice: '$9,500.00',
      totalPrice: '$9,500.00',
    },
    {
      id: 'so-li-4',
      name: 'Premium support SLA',
      frequency: 'Yearly',
      quantity: '01',
      unitPrice: '$12,000.00',
      totalPrice: '$12,000.00',
    },
    {
      id: 'so-li-5',
      name: 'Sandbox environments',
      frequency: 'Yearly',
      quantity: '03',
      unitPrice: '$1,500.00',
      totalPrice: '$4,500.00',
    },
  ],

  upcomingBillingSchedule: [
    { id: 'so-bs-1', billDate: 'Aug 31, 2026', installment: 'Year 1 · Q2', amount: '$41,000.00', status: 'Pending' },
    { id: 'so-bs-2', billDate: 'Nov 30, 2026', installment: 'Year 1 · Q3', amount: '$41,000.00', status: 'Upcoming' },
    { id: 'so-bs-3', billDate: 'Feb 28, 2027', installment: 'Year 1 · Q4', amount: '$41,000.00', status: 'Upcoming' },
    { id: 'so-bs-4', billDate: 'May 31, 2027', installment: 'Year 2 · Q1', amount: '$43,050.00', status: 'Upcoming' },
    { id: 'so-bs-5', billDate: 'Aug 31, 2027', installment: 'Year 2 · Q2', amount: '$43,050.00', status: 'Upcoming' },
  ],

  pastInvoices: [
    { id: 'so-pi-1', invoiceId: 'INV-2026-0042', date: 'May 1, 2026', status: 'Paid', amount: '$41,000.00' },
    { id: 'so-pi-2', invoiceId: 'INV-2026-8847', date: 'May 1, 2026', status: 'Paid', amount: '$54,000.00' },
    { id: 'so-pi-3', invoiceId: 'INV-2026-9584', date: 'Jun 15, 2026', status: 'Pending', amount: '$126,000.00' },
  ],

  comments: pioneerComments,
}

const secondSalesOrder: SalesOrder = {
  id: 'so-pioneer-0128',
  soId: 'SO-2025-0128',
  customerName: 'Pioneer Systems',
  dealTag: 'RENEWAL',
  sourceQuote: 'Q-2025-1602',
  createdOn: 'Jan 1, 2025',
  startDate: 'Jan 1, 2025',
  rampDetails: 'No ramp',
  totalContractValue: '$144,000.00',
  avgAnnualValue: '$144,000.00',
  contractTerm: '12 months',
  renewalAction: 'Auto-renew',

  committedEntitlements: [
    { label: 'Seat cap', value: '40 seats' },
    { label: 'API allowance', value: '2M calls / month' },
    { label: 'Environments', value: '1 sandbox' },
    { label: 'Support tier', value: 'Standard SLA' },
  ],

  products: [
    {
      id: 'so2-li-1',
      name: 'Apex platform - growth services',
      frequency: 'Yearly',
      quantity: '40',
      unitPrice: '$2,400.00',
      totalPrice: '$96,000.00',
    },
    {
      id: 'so2-li-2',
      name: 'Standard support SLA',
      frequency: 'Yearly',
      quantity: '01',
      unitPrice: '$6,000.00',
      totalPrice: '$6,000.00',
    },
  ],

  upcomingBillingSchedule: [
    { id: 'so2-bs-1', billDate: 'Dec 31, 2025', installment: 'Year 1 · Q4', amount: '$36,000.00', status: 'Upcoming' },
  ],

  pastInvoices: [
    { id: 'so2-pi-1', invoiceId: 'INV-2025-6421', date: 'Jan 1, 2026', status: 'Paid', amount: '$48,000.00' },
    { id: 'so2-pi-2', invoiceId: 'INV-2025-5890', date: 'Nov 1, 2025', status: 'Paid', amount: '$42,000.00' },
  ],

  comments: [
    {
      id: 'so2-c-1',
      author: 'Adrian Brody',
      initials: 'AB',
      timestamp: '3 days ago',
      body: 'Renewal auto-renews unless cancelled 30 days prior to term end.',
      linkedSection: 'Summary',
      linkedSectionId: 'summary',
    },
  ],
}

const thirdSalesOrder: SalesOrder = {
  id: 'so-pioneer-0091',
  soId: 'SO-2024-0091',
  customerName: 'Pioneer Systems',
  dealTag: 'NEW DEAL',
  sourceQuote: 'Q-2024-1188',
  createdOn: 'Mar 15, 2024',
  startDate: 'Apr 1, 2024',
  rampDetails: 'No ramp',
  totalContractValue: '$72,000.00',
  avgAnnualValue: '$72,000.00',
  contractTerm: '12 months',
  renewalAction: 'Renewed',

  committedEntitlements: [
    { label: 'Seat cap', value: '25 seats' },
    { label: 'API allowance', value: '1M calls / month' },
    { label: 'Support tier', value: 'Standard SLA' },
  ],

  products: [
    {
      id: 'so3-li-1',
      name: 'Apex platform - starter services',
      frequency: 'Yearly',
      quantity: '25',
      unitPrice: '$1,200.00',
      totalPrice: '$30,000.00',
    },
    {
      id: 'so3-li-2',
      name: 'Implementation services',
      frequency: 'One-time',
      quantity: '01',
      unitPrice: '$12,000.00',
      totalPrice: '$12,000.00',
    },
  ],

  upcomingBillingSchedule: [],

  pastInvoices: [
    { id: 'so3-pi-1', invoiceId: 'INV-2024-3010', date: 'Apr 1, 2024', status: 'Paid', amount: '$36,000.00' },
    { id: 'so3-pi-2', invoiceId: 'INV-2024-2851', date: 'Jul 1, 2024', status: 'Cancelled', amount: '$36,000.00' },
  ],

  comments: [],
}

export const salesOrders: SalesOrder[] = [
  pioneerSalesOrder,
  secondSalesOrder,
  thirdSalesOrder,
]

export function getSalesOrderById(id: string): SalesOrder {
  return salesOrders.find((o) => o.id === id) ?? pioneerSalesOrder
}
