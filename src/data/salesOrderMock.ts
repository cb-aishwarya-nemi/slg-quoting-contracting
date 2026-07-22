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

export interface UsageSummaryFeature {
  feature: string
  included: string
  onDemand: string
  includedTone?: 'default' | 'warning' | 'danger'
}

export interface UsageSummaryCycle {
  id: string
  label: string
  isCurrent?: boolean
  features: UsageSummaryFeature[]
}

export interface SalesOrderProduct {
  id: string
  name: string
  frequency: string
  quantity: string
  unitPrice: string
  totalPrice: string
  /** price change percentage vs. the previous ramp period (e.g. 7 for +7%) */
  rampPriceChange?: number
}

export interface SalesOrderRampPeriod {
  id: string
  label: string
  startDate: string
  endDate: string
  items: SalesOrderProduct[]
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

export type CreditNoteStatus = 'Applied' | 'Refunded' | 'Pending'

export interface PastCreditNoteLine {
  id: string
  creditNoteId: string
  date: string
  status: CreditNoteStatus
  amount: string
}

export interface LinkedRecord {
  label: string
  value: string
  /** When false, value renders as plain text (e.g. empty renewal). Defaults to true. */
  href?: boolean
}

export interface ActivityItem {
  id: string
  /** Human-readable event, e.g. "First invoice sent" */
  label: string
  date: string
  /** Object identifier the event links to (rendered as a blue hyperlink) */
  refId?: string
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
  accruedValue: string
  contractTerm: string
  renewalAction: string
  /** Contract renewal date in mmm yyyy (e.g. Jul 2029) */
  renewalDate: string
  /** Sora headline for the AI note (leads with the first-invoice-sent fact) */
  headline: string
  /** Verbose supporting text for the AI note */
  aiSummary: string
  usageSummary: UsageSummaryFeature[]
  /** optional per-cycle usage — powers the cycle switcher in Usage summary */
  usageSummaryCycles?: UsageSummaryCycle[]
  products: SalesOrderProduct[]
  /** optional ramp breakdown — when present the products render as collapsible periods */
  productPeriods?: SalesOrderRampPeriod[]
  upcomingBillingSchedule: BillingScheduleLine[]
  pastInvoices: PastInvoiceLine[]
  pastCreditNotes: PastCreditNoteLine[]
  linkedRecords: LinkedRecord[]
  /** section-wise comments keyed via linkedSectionId */
  comments: Comment[]
  /** chronological account activity for the Activity timeline */
  activity: ActivityItem[]
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
    linkedSection: 'Usage summary',
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
  accruedValue: '$95,000.00',
  contractTerm: '36 months',
  renewalAction: 'Manual renewal',
  renewalDate: 'Jul 2029',

  headline: 'Everything is on track — Pioneer Systems is live and billing on schedule.',
  aiSummary:
    '$492K contract over 36 months with two ramp periods. Quarterly billing runs $41K in Year 1, stepping to $43K in Year 2. First invoice sent; entitlements are active.',

  usageSummary: [
    { feature: 'Image creation', included: '2,273/2,500', onDemand: '0', includedTone: 'warning' },
    { feature: 'API calls', included: '1.4M/5M', onDemand: '0' },
    { feature: 'Seat licenses', included: '32/50', onDemand: '0' },
    { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
    { feature: 'Video storage', included: '95GB/500GB', onDemand: '0' },
  ],

  usageSummaryCycles: [
    {
      id: 'jul-2026',
      label: 'Jul 2026',
      isCurrent: true,
      features: [
        { feature: 'Image creation', included: '2,273/2,500', onDemand: '0', includedTone: 'warning' },
        { feature: 'API calls', included: '1.4M/5M', onDemand: '0' },
        { feature: 'Seat licenses', included: '32/50', onDemand: '0' },
        { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
        { feature: 'Video storage', included: '95GB/500GB', onDemand: '0' },
      ],
    },
    {
      id: 'jun-2026',
      label: 'Jun 2026',
      features: [
        { feature: 'Image creation', included: '2,500/2,500', onDemand: '342', includedTone: 'danger' },
        { feature: 'API calls', included: '1.8M/5M', onDemand: '0' },
        { feature: 'Seat licenses', included: '34/50', onDemand: '0' },
        { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
        { feature: 'Video storage', included: '80GB/500GB', onDemand: '0' },
      ],
    },
    {
      id: 'may-2026',
      label: 'May 2026',
      features: [
        { feature: 'Image creation', included: '1,890/2,500', onDemand: '0' },
        { feature: 'API calls', included: '1.2M/5M', onDemand: '0' },
        { feature: 'Seat licenses', included: '30/50', onDemand: '0' },
        { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
        { feature: 'Video storage', included: '72GB/500GB', onDemand: '0' },
      ],
    },
    {
      id: 'apr-2026',
      label: 'Apr 2026',
      features: [
        { feature: 'Image creation', included: '1,620/2,500', onDemand: '0' },
        { feature: 'API calls', included: '1.1M/5M', onDemand: '0' },
        { feature: 'Seat licenses', included: '28/50', onDemand: '0' },
        { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
        { feature: 'Video storage', included: '64GB/500GB', onDemand: '0' },
      ],
    },
    {
      id: 'mar-2026',
      label: 'Mar 2026',
      features: [
        { feature: 'Image creation', included: '1,420/2,500', onDemand: '0' },
        { feature: 'API calls', included: '980K/5M', onDemand: '0' },
        { feature: 'Seat licenses', included: '26/50', onDemand: '0' },
        { feature: 'Sandbox environments', included: '1/3', onDemand: '0' },
        { feature: 'Video storage', included: '58GB/500GB', onDemand: '0' },
      ],
    },
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

  productPeriods: [
    {
      id: 'so-period-1',
      label: 'Period 1',
      startDate: '1 May 2026',
      endDate: '30 Apr 2027',
      items: [
        { id: 'so-p1-1', name: 'Apex platform - growth services', frequency: 'Yearly', quantity: '50', unitPrice: '$2,400.00', totalPrice: '$120,000.00' },
        { id: 'so-p1-2', name: 'Implementation services', frequency: 'Yearly', quantity: '01', unitPrice: '$18,000.00', totalPrice: '$18,000.00' },
        { id: 'so-p1-3', name: 'Onboarding & Training', frequency: 'One-time', quantity: '01', unitPrice: '$9,500.00', totalPrice: '$9,500.00' },
        { id: 'so-p1-4', name: 'Premium support SLA', frequency: 'Yearly', quantity: '01', unitPrice: '$12,000.00', totalPrice: '$12,000.00' },
        { id: 'so-p1-5', name: 'Sandbox environments', frequency: 'Yearly', quantity: '03', unitPrice: '$1,500.00', totalPrice: '$4,500.00' },
      ],
    },
    {
      id: 'so-period-2',
      label: 'Period 2',
      startDate: '1 May 2027',
      endDate: '30 Apr 2028',
      items: [
        { id: 'so-p2-1', name: 'Apex platform - growth services', frequency: 'Yearly', quantity: '75', unitPrice: '$2,568.00', totalPrice: '$192,600.00', rampPriceChange: 7 },
        { id: 'so-p2-2', name: 'Premium support SLA', frequency: 'Yearly', quantity: '01', unitPrice: '$12,840.00', totalPrice: '$12,840.00', rampPriceChange: 7 },
        { id: 'so-p2-3', name: 'Sandbox environments', frequency: 'Yearly', quantity: '03', unitPrice: '$1,605.00', totalPrice: '$4,815.00', rampPriceChange: 7 },
      ],
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

  pastCreditNotes: [
    { id: 'so-cn-1', creditNoteId: 'CN-2026-0112', date: 'May 12, 2026', status: 'Applied', amount: '-$2,400.00' },
    { id: 'so-cn-2', creditNoteId: 'CN-2026-0188', date: 'Jun 3, 2026', status: 'Refunded', amount: '-$850.00' },
  ],

  linkedRecords: [
    { label: 'CRM Account', value: 'Pioneer Systems' },
    { label: 'CRM Opportunity', value: 'OPP-2026-1847' },
    { label: 'Contracts', value: 'Pioneer_Systems_MSA_2026.pdf' },
  ],

  comments: pioneerComments,

  activity: [
    { id: 'so-a-8', label: 'First invoice sent', date: 'May 1, 2026', refId: 'INV-2026-0042' },
    { id: 'so-a-7', label: 'First invoice generated', date: 'May 1, 2026', refId: 'INV-2026-0042' },
    { id: 'so-a-6', label: 'Sales order created', date: 'May 1, 2026', refId: 'SO-2026-0153' },
    { id: 'so-a-5', label: 'Customer created', date: 'Apr 30, 2026', refId: 'Pioneer Systems' },
    { id: 'so-a-4', label: 'Contract processed', date: 'Apr 30, 2026', refId: 'TSK-2026-0153' },
    { id: 'so-a-3', label: 'Contract signed', date: 'Apr 28, 2026', refId: 'MSA-2026-PS-001' },
    { id: 'so-a-2', label: 'Quote approved', date: 'Apr 22, 2026', refId: 'Q-2026-1847' },
    { id: 'so-a-1', label: 'Quote created', date: 'Apr 18, 2026', refId: 'Q-2026-1847' },
  ],
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
  accruedValue: '$144,000.00',
  contractTerm: '12 months',
  renewalAction: 'Auto-renew',
  renewalDate: 'Aug 2026',

  headline: 'The first invoice of $48,000.00 has been sent to Pioneer Systems.',
  aiSummary:
    'Sales order SO-2025-0128 was created on Jan 1, 2025 and starts on Jan 1, 2025. This is a flat 12-month renewal with no ramp — billing $36,000.00 per quarter. The total contract value is $144,000.00 and the order auto-renews unless cancelled 30 days prior to term end.',

  usageSummary: [
    { feature: 'API calls', included: '620K/2M', onDemand: '0' },
    { feature: 'Seat licenses', included: '28/40', onDemand: '0' },
    { feature: 'Sandbox environments', included: '1/1', onDemand: '0' },
    { feature: 'Image creation', included: '890/1,000', onDemand: '0', includedTone: 'warning' },
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

  pastCreditNotes: [],

  linkedRecords: [
    { label: 'CRM Account', value: 'Pioneer Systems' },
    { label: 'CRM Opportunity', value: 'OPP-2025-0921' },
    { label: 'Contracts', value: 'Pioneer_Systems_Renewal_2025.pdf' },
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

  activity: [
    { id: 'so2-a-5', label: 'First invoice sent', date: 'Jan 1, 2025', refId: 'INV-2025-6421' },
    { id: 'so2-a-4', label: 'Sales order created', date: 'Jan 1, 2025', refId: 'SO-2025-0128' },
    { id: 'so2-a-3', label: 'Contract signed', date: 'Dec 28, 2024', refId: 'MSA-2025-PS-002' },
    { id: 'so2-a-2', label: 'Quote approved', date: 'Dec 20, 2024', refId: 'Q-2025-1602' },
    { id: 'so2-a-1', label: 'Quote created', date: 'Dec 15, 2024', refId: 'Q-2025-1602' },
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
  accruedValue: '$72,000.00',
  contractTerm: '12 months',
  renewalAction: 'Renewed',
  renewalDate: 'Oct 2025',

  headline: 'The first invoice of $36,000.00 was sent to Pioneer Systems.',
  aiSummary:
    'Sales order SO-2024-0091 was created on Mar 15, 2024 and started on Apr 1, 2024. This 12-month starter contract had no ramp, billing $36,000.00 per half-year. The total contract value was $72,000.00 and the order has since been renewed.',

  usageSummary: [
    { feature: 'API calls', included: '520K/1M', onDemand: '0' },
    { feature: 'Seat licenses', included: '18/25', onDemand: '0' },
    { feature: 'Image creation', included: '640/750', onDemand: '0', includedTone: 'warning' },
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

  pastCreditNotes: [],

  linkedRecords: [
    { label: 'CRM Account', value: 'Pioneer Systems' },
    { label: 'CRM Opportunity', value: 'OPP-2024-1188' },
    { label: 'Contracts', value: 'Pioneer_Systems_Order_Form_2024.pdf' },
  ],

  comments: [],

  activity: [
    { id: 'so3-a-5', label: 'First invoice sent', date: 'Apr 1, 2024', refId: 'INV-2024-3010' },
    { id: 'so3-a-4', label: 'Sales order created', date: 'Mar 15, 2024', refId: 'SO-2024-0091' },
    { id: 'so3-a-3', label: 'Contract signed', date: 'Mar 12, 2024', refId: 'MSA-2024-PS-003' },
    { id: 'so3-a-2', label: 'Quote approved', date: 'Mar 5, 2024', refId: 'Q-2024-1188' },
    { id: 'so3-a-1', label: 'Quote created', date: 'Feb 28, 2024', refId: 'Q-2024-1188' },
  ],
}

const fourthSalesOrder: SalesOrder = {
  id: 'so-pioneer-0044',
  soId: 'SO-2023-0044',
  customerName: 'Pioneer Systems',
  dealTag: 'RENEWAL',
  sourceQuote: 'Q-2023-0921',
  createdOn: 'May 1, 2023',
  startDate: 'May 1, 2023',
  rampDetails: 'No ramp',
  totalContractValue: '$96,000.00',
  avgAnnualValue: '$96,000.00',
  accruedValue: '$96,000.00',
  contractTerm: '12 months',
  renewalAction: 'Manual renewal',
  renewalDate: 'Feb 2024',

  headline: 'This sales order expired on Apr 30, 2024 with no renewal in place.',
  aiSummary:
    'Sales order SO-2023-0044 ran from May 1, 2023 through Apr 30, 2024. The contract billed $24,000.00 per quarter for a total value of $96,000.00 and has since expired.',

  usageSummary: [
    { feature: 'API calls', included: '680K/1.5M', onDemand: '0' },
    { feature: 'Seat licenses', included: '19/30', onDemand: '0' },
  ],

  products: [
    {
      id: 'so4-li-1',
      name: 'Apex platform - starter services',
      frequency: 'Yearly',
      quantity: '30',
      unitPrice: '$2,400.00',
      totalPrice: '$72,000.00',
    },
    {
      id: 'so4-li-2',
      name: 'Standard support SLA',
      frequency: 'Yearly',
      quantity: '01',
      unitPrice: '$6,000.00',
      totalPrice: '$6,000.00',
    },
  ],

  upcomingBillingSchedule: [],

  pastInvoices: [
    { id: 'so4-pi-1', invoiceId: 'INV-2023-4410', date: 'May 1, 2023', status: 'Paid', amount: '$24,000.00' },
    { id: 'so4-pi-2', invoiceId: 'INV-2024-1182', date: 'Feb 1, 2024', status: 'Paid', amount: '$24,000.00' },
  ],

  pastCreditNotes: [],

  linkedRecords: [
    { label: 'CRM Account', value: 'Pioneer Systems' },
    { label: 'CRM Opportunity', value: 'OPP-2023-0921' },
    { label: 'Contracts', value: 'Pioneer_Systems_MSA_2023.pdf' },
  ],

  comments: [],

  activity: [
    { id: 'so4-a-3', label: 'Sales order created', date: 'May 1, 2023', refId: 'SO-2023-0044' },
    { id: 'so4-a-2', label: 'Quote approved', date: 'Apr 20, 2023', refId: 'Q-2023-0921' },
    { id: 'so4-a-1', label: 'Quote created', date: 'Apr 12, 2023', refId: 'Q-2023-0921' },
  ],
}

const fifthSalesOrder: SalesOrder = {
  id: 'so-pioneer-0201',
  soId: 'SO-2025-0201',
  customerName: 'Pioneer Systems',
  dealTag: 'NEW DEAL',
  sourceQuote: 'Q-2025-2044',
  createdOn: 'Oct 1, 2025',
  startDate: 'Oct 1, 2025',
  rampDetails: 'No ramp',
  totalContractValue: '$180,000.00',
  avgAnnualValue: '$180,000.00',
  accruedValue: '$45,000.00',
  contractTerm: '12 months',
  renewalAction: 'Auto-renew',
  renewalDate: 'Jan 2027',

  headline: 'The next invoice of $45,000.00 is due in 14 days.',
  aiSummary:
    'Sales order SO-2025-0201 was created on Oct 1, 2025 and expires on Sep 30, 2026. The contract bills $45,000.00 per quarter with a total value of $180,000.00.',

  usageSummary: [
    { feature: 'API calls', included: '1.1M/3M', onDemand: '0' },
    { feature: 'Seat licenses', included: '28/45', onDemand: '0' },
    { feature: 'Image creation', included: '1,120/1,500', onDemand: '0' },
    { feature: 'Sandbox environments', included: '1/1', onDemand: '0' },
  ],

  products: [
    {
      id: 'so5-li-1',
      name: 'Apex platform - growth services',
      frequency: 'Yearly',
      quantity: '45',
      unitPrice: '$2,400.00',
      totalPrice: '$108,000.00',
    },
    {
      id: 'so5-li-2',
      name: 'Premium support SLA',
      frequency: 'Yearly',
      quantity: '01',
      unitPrice: '$12,000.00',
      totalPrice: '$12,000.00',
    },
  ],

  upcomingBillingSchedule: [
    { id: 'so5-bs-1', billDate: 'Jul 15, 2026', installment: 'Year 1 · Q3', amount: '$45,000.00', status: 'Pending' },
    { id: 'so5-bs-2', billDate: 'Oct 15, 2026', installment: 'Year 1 · Q4', amount: '$45,000.00', status: 'Upcoming' },
  ],

  pastInvoices: [
    { id: 'so5-pi-1', invoiceId: 'INV-2025-9102', date: 'Oct 1, 2025', status: 'Paid', amount: '$45,000.00' },
    { id: 'so5-pi-2', invoiceId: 'INV-2026-2218', date: 'Jan 15, 2026', status: 'Paid', amount: '$45,000.00' },
  ],

  pastCreditNotes: [],

  linkedRecords: [
    { label: 'CRM Account', value: 'Pioneer Systems' },
    { label: 'CRM Opportunity', value: 'OPP-2025-2044' },
    { label: 'Contracts', value: 'Pioneer_Systems_MSA_2025.pdf' },
  ],

  comments: [],

  activity: [
    { id: 'so5-a-4', label: 'First invoice sent', date: 'Oct 1, 2025', refId: 'INV-2025-9102' },
    { id: 'so5-a-3', label: 'Sales order created', date: 'Oct 1, 2025', refId: 'SO-2025-0201' },
    { id: 'so5-a-2', label: 'Quote approved', date: 'Sep 22, 2025', refId: 'Q-2025-2044' },
    { id: 'so5-a-1', label: 'Quote created', date: 'Sep 15, 2025', refId: 'Q-2025-2044' },
  ],
}

export const salesOrders: SalesOrder[] = [
  pioneerSalesOrder,
  secondSalesOrder,
  thirdSalesOrder,
  fifthSalesOrder,
  fourthSalesOrder,
]

export function getSalesOrderById(id: string): SalesOrder {
  return salesOrders.find((o) => o.id === id) ?? pioneerSalesOrder
}

/**
 * Products & pricing for the All good period switcher (calendar periods 1–3).
 * Reflects the amendment evolution: original → seat expansion → Year 2 ramp.
 * Always returns all three periods; the selected one is listed first so the
 * table shows it with a “2 more periods” link underneath.
 */
const PIONEER_PERIOD_PRODUCTS: SalesOrderRampPeriod[] = [
  {
    id: 'so-switch-period-1',
    label: 'Period 1',
    startDate: '1 May 2025',
    endDate: '31 Dec 2025',
    items: [
      {
        id: 'so-p1-1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '50',
        unitPrice: '$2,400.00',
        totalPrice: '$120,000.00',
      },
      {
        id: 'so-p1-2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'so-p1-3',
        name: 'Onboarding & Training',
        frequency: 'One-time',
        quantity: '01',
        unitPrice: '$9,500.00',
        totalPrice: '$9,500.00',
      },
      {
        id: 'so-p1-4',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,000.00',
        totalPrice: '$12,000.00',
      },
      {
        id: 'so-p1-5',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '02',
        unitPrice: '$1,500.00',
        totalPrice: '$3,000.00',
      },
    ],
  },
  {
    id: 'so-switch-period-2',
    label: 'Period 2',
    startDate: '1 Jan 2026',
    endDate: '31 Dec 2026',
    items: [
      {
        id: 'so-p2-1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '75',
        unitPrice: '$2,400.00',
        totalPrice: '$180,000.00',
      },
      {
        id: 'so-p2-2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'so-p2-3',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,000.00',
        totalPrice: '$12,000.00',
      },
      {
        id: 'so-p2-4',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '03',
        unitPrice: '$1,500.00',
        totalPrice: '$4,500.00',
      },
    ],
  },
  {
    id: 'so-switch-period-3',
    label: 'Period 3',
    startDate: '1 Jan 2027',
    endDate: '31 Dec 2027',
    items: [
      {
        id: 'so-p3-1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '75',
        unitPrice: '$2,568.00',
        totalPrice: '$192,600.00',
        rampPriceChange: 7,
      },
      {
        id: 'so-p3-2',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,840.00',
        totalPrice: '$12,840.00',
        rampPriceChange: 7,
      },
      {
        id: 'so-p3-3',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '03',
        unitPrice: '$1,605.00',
        totalPrice: '$4,815.00',
        rampPriceChange: 7,
      },
    ],
  },
]

export function getSalesOrderProductsForPeriod(
  orderId: string,
  periodIndex: number
): { items: SalesOrderProduct[]; periods: SalesOrderRampPeriod[]; primaryPeriodId: string } | null {
  if (orderId !== 'so-pioneer-0153') return null

  const selectedIdx = Math.max(
    0,
    Math.min(PIONEER_PERIOD_PRODUCTS.length - 1, periodIndex - 1)
  )
  const selected = PIONEER_PERIOD_PRODUCTS[selectedIdx]

  return {
    items: selected.items,
    periods: PIONEER_PERIOD_PRODUCTS,
    primaryPeriodId: selected.id,
  }
}

export function getUsageSummaryCycles(order: SalesOrder): UsageSummaryCycle[] {
  if (order.usageSummaryCycles?.length) return order.usageSummaryCycles
  return [
    {
      id: 'current',
      label: 'Current cycle',
      isCurrent: true,
      features: order.usageSummary,
    },
  ]
}
