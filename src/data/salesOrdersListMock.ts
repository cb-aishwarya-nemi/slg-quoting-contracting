import { salesOrders, type SalesOrder } from '@/data/salesOrderMock'
import { formatRelativeToNow } from '@/lib/utils'

export type SalesOrderStatus = 'Active' | 'Expired' | 'Renewed'

export interface SalesOrderListItem {
  id: string
  soId: string
  customer: string
  customerId: string
  tcv: string
  dealTag: string
  createdOn: string
  nextInvoice: string
  starts: string
  expires: string
  status: SalesOrderStatus
}

export const DEAL_TAG_STYLES: Record<string, string> = {
  'NEW DEAL': 'bg-blue-50 text-blue-700',
  RENEWAL: 'bg-violet-50 text-violet-700',
}

export const SALES_ORDER_STATUS_STYLES: Record<SalesOrderStatus, { bg: string; text: string }> = {
  Active: { bg: 'bg-green-50', text: 'text-green-700' },
  Expired: { bg: 'bg-red-50', text: 'text-red-700' },
  Renewed: { bg: 'bg-violet-50', text: 'text-violet-700' },
}

function getNextInvoiceRelative(order: SalesOrder): string {
  const upcoming = order.upcomingBillingSchedule
    .filter((line) => line.status === 'Pending' || line.status === 'Upcoming')
    .map((line) => ({ date: new Date(line.billDate), line }))
    .filter(({ date }) => !isNaN(date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextUpcoming = upcoming.find(({ date }) => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return startOfTarget.getTime() >= startOfToday.getTime()
  })

  if (nextUpcoming) {
    return formatRelativeToNow(nextUpcoming.date)
  }

  const pendingInvoice = order.pastInvoices.find((inv) => inv.status === 'Pending')
  if (pendingInvoice) {
    const date = new Date(pendingInvoice.date)
    if (!isNaN(date.getTime())) {
      return formatRelativeToNow(date)
    }
  }

  return '—'
}

/** Prototype fallbacks when billing schedule has no future installment */
const NEXT_INVOICE_OVERRIDES: Partial<Record<string, string>> = {
  'so-pioneer-0128': 'in 7 days',
  'so-pioneer-0091': 'in 3 weeks',
  'so-pioneer-0201': 'in 1 week',
}

function resolveNextInvoice(order: SalesOrder): string {
  return NEXT_INVOICE_OVERRIDES[order.id] ?? getNextInvoiceRelative(order)
}

/** Prototype expiry overrides for richer KPI / table demo */
const EXPIRES_OVERRIDES: Partial<Record<string, string>> = {
  'so-pioneer-0128': 'Aug 30, 2026',
}

function resolveExpires(order: SalesOrder): string {
  return EXPIRES_OVERRIDES[order.id] ?? getExpiresDate(order)
}

function getExpiresDate(order: SalesOrder): string {
  const monthsMatch = order.contractTerm.match(/(\d+)\s*months?/i)
  if (!monthsMatch) return '—'

  const months = parseInt(monthsMatch[1], 10)
  const start = new Date(order.startDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)

  return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const NEARING_EXPIRY_DAYS = 90

function parseExpiresDate(expires: string): Date | null {
  if (expires === '—') return null
  const parsed = new Date(expires)
  return isNaN(parsed.getTime()) ? null : parsed
}

export function isOrderExpired(expires: string, now = new Date()): boolean {
  const date = parseExpiresDate(expires)
  if (!date) return false
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfExpiry = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return startOfExpiry.getTime() < startOfToday.getTime()
}

export function isOrderNearingExpiry(expires: string, now = new Date()): boolean {
  const date = parseExpiresDate(expires)
  if (!date) return false
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfExpiry = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round(
    (startOfExpiry.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  )
  return diffDays >= 0 && diffDays <= NEARING_EXPIRY_DAYS
}

const ORDER_CUSTOMER: Record<string, { name: string; customerId: string }> = {
  'so-pioneer-0153': { name: 'Pioneer Systems', customerId: 'pioneer-systems' },
  'so-pioneer-0128': { name: 'Echo Corp', customerId: 'echo-corp' },
  'so-pioneer-0091': { name: 'Lumina AI', customerId: 'lumina-ai' },
  'so-pioneer-0201': { name: 'Atlas BioSystems', customerId: 'atlas-biosystems' },
  'so-pioneer-0044': { name: 'Beacon Data Co', customerId: 'beacon-data-co' },
}

export const salesOrdersListData: SalesOrderListItem[] = salesOrders.map((order, index) => {
  const customer = ORDER_CUSTOMER[order.id] ?? {
    name: order.customerName,
    customerId: 'pioneer-systems',
  }

  return {
    id: order.id,
    soId: order.soId,
    customer: customer.name,
    customerId: customer.customerId,
    tcv: order.totalContractValue,
    dealTag: order.dealTag,
    createdOn: order.createdOn,
    nextInvoice: resolveNextInvoice(order),
    starts: order.startDate,
    expires: resolveExpires(order),
    status: index === salesOrders.length - 1 ? 'Expired' : 'Active',
  }
})

// ── Preview panel context (actionable fields for CS, RevOps, Billing, Support) ──

export type PaymentBehaviourTone = 'positive' | 'warning' | 'negative' | 'neutral'

export interface SalesOrderPreviewContext {
  customerSince: string
  customerTenure: string
  paymentBehaviour: string
  paymentBehaviourTone: PaymentBehaviourTone
  paymentBehaviourDetail: string
  nextInvoiceAmount: string
  nextInvoiceDate: string
  openBalance: string
  openBalanceSub?: string
  paymentTerms: string
  paymentTermsSub?: string
  paymentMethod?: string
  paymentMethodSub?: string
  lastPayment: string
  lastPaymentSub?: string
  contractEnd?: string
  contractEndSub?: string
  activityFooter?: string
  avgAnnualValue: string
  renewalWindow: string
  accountOwner: string
}

const CUSTOMER_ACCOUNT: Record<string, { since: string; tenure: string; owner: string }> = {
  'pioneer-systems': { since: 'Apr 30, 2026', tenure: '2 months', owner: 'Adrian Brody' },
  'echo-corp': { since: 'Jan 12, 2023', tenure: '3 years 6 months', owner: 'Sarah Chen' },
  'lumina-ai': { since: 'Mar 8, 2022', tenure: '4 years 4 months', owner: 'Marcus Webb' },
  'atlas-biosystems': { since: 'Jun 3, 2024', tenure: '1 year 1 month', owner: 'Elena Rodriguez' },
  'beacon-data-co': { since: 'Nov 15, 2019', tenure: '6 years 8 months', owner: 'James Park' },
}

const BILLING_CONTACT: Record<string, { name: string; email: string }> = {
  'pioneer-systems': { name: 'Alex Nguyen', email: 'alex.nguyen@pioneersystems.com' },
  'echo-corp': { name: 'Sarah Chen', email: 'sarah.chen@echocorp.io' },
  'lumina-ai': { name: 'Marcus Webb', email: 'marcus.webb@lumina.ai' },
  'atlas-biosystems': { name: 'Elena Rodriguez', email: 'elena.rodriguez@atlasbio.com' },
  'beacon-data-co': { name: 'James Park', email: 'james.park@beacondata.co' },
}

const PREVIEW_OVERRIDES: Partial<Record<string, Partial<SalesOrderPreviewContext>>> = {
  'so-pioneer-0153': {
    paymentBehaviour: '1 invoice overdue',
    paymentBehaviourTone: 'warning',
    paymentBehaviourDetail: 'INV-2026-9584 ($126,000) awaiting payment',
    nextInvoiceAmount: '$41,000',
    nextInvoiceDate: 'Aug 31, 2026',
    openBalance: '$126,000',
    openBalanceSub: 'Due Jul 10 · 4 days overdue',
    paymentTermsSub: '26 days outstanding',
    paymentMethod: 'Visa ····4291',
    paymentMethodSub: 'Expires Jul 2026',
    lastPayment: 'May 1, 2026',
    lastPaymentSub: 'On time · cleared in 3 days',
    contractEnd: 'Jul 2029',
    contractEndSub: '3 years · auto-renews',
    activityFooter: 'No activity logged since signing · May 6',
    renewalWindow: 'Manual renewal · 90-day notice',
  },
  'so-pioneer-0128': {
    paymentBehaviour: 'Pays on time',
    paymentBehaviourTone: 'positive',
    paymentBehaviourDetail: '8 of 8 invoices paid within Net 30',
    nextInvoiceAmount: '$36,000',
    nextInvoiceDate: 'Jul 14, 2026',
    openBalance: '$0',
    openBalanceSub: 'All invoices current',
    paymentTermsSub: 'Paid within terms',
    paymentMethod: 'ACH ····8821',
    lastPayment: 'Jan 1, 2026',
    lastPaymentSub: 'On time · cleared in 2 days',
    contractEnd: 'Aug 2026',
    contractEndSub: 'Auto-renews · 30 days before expiry',
    activityFooter: 'Last activity · invoice sent Jan 2',
    renewalWindow: 'Auto-renew · 30 days before expiry',
  },
  'so-pioneer-0091': {
    paymentBehaviour: 'Paid 19 days late',
    paymentBehaviourTone: 'warning',
    paymentBehaviourDetail: 'INV-2024-4412 ($48,000) paid 19 days late',
    nextInvoiceAmount: '—',
    nextInvoiceDate: '—',
    openBalance: '$0',
    openBalanceSub: 'No open balance',
    paymentTermsSub: '1 late payment in last 12 months',
    paymentMethod: 'Wire transfer',
    lastPayment: 'Oct 15, 2024',
    lastPaymentSub: 'Paid 19 days late',
    contractEnd: 'Oct 2025',
    contractEndSub: 'Renewed to SO-2025-0128',
    activityFooter: 'Renewal completed · Nov 2024',
    renewalWindow: 'Renewed to SO-2025-0128',
  },
  'so-pioneer-0201': {
    paymentBehaviour: 'Pays on time',
    paymentBehaviourTone: 'positive',
    paymentBehaviourDetail: '2 of 2 invoices paid within Net 30',
    nextInvoiceAmount: '$45,000',
    nextInvoiceDate: 'Jul 15, 2026',
    openBalance: '$0',
    openBalanceSub: 'All invoices current',
    paymentTermsSub: 'Paid within terms',
    paymentMethod: 'Mastercard ····1182',
    lastPayment: 'Jan 15, 2026',
    lastPaymentSub: 'On time · cleared in 1 day',
    contractEnd: 'Jan 2027',
    contractEndSub: 'Auto-renews · 30 days before expiry',
    activityFooter: 'Last activity · payment received Jan 16',
    renewalWindow: 'Auto-renew · 30 days before expiry',
  },
  'so-pioneer-0044': {
    paymentBehaviour: 'Churned',
    paymentBehaviourTone: 'negative',
    paymentBehaviourDetail: 'Final invoice paid 12 days late; no renewal',
    nextInvoiceAmount: '—',
    nextInvoiceDate: '—',
    openBalance: '$0',
    openBalanceSub: 'Account closed',
    paymentTermsSub: 'Final invoice settled late',
    paymentMethod: 'Visa ····9034',
    paymentMethodSub: 'Card removed',
    lastPayment: 'Feb 28, 2024',
    lastPaymentSub: 'Paid 12 days late',
    contractEnd: 'Feb 2024',
    contractEndSub: 'Expired · no renewal in place',
    activityFooter: 'Account churned · Mar 2024',
    renewalWindow: 'Expired · no renewal in place',
  },
}

function getNextBillingLine(order: SalesOrder) {
  return order.upcomingBillingSchedule.find(
    (line) => line.status === 'Pending' || line.status === 'Upcoming'
  )
}

function getOpenBalance(order: SalesOrder): string {
  const pending = order.pastInvoices
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, '')), 0)
  if (pending > 0) {
    return `$${pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return '$0.00'
}

function getLastPaidInvoice(order: SalesOrder): string {
  const paid = order.pastInvoices.filter((inv) => inv.status === 'Paid')
  if (paid.length === 0) return '—'
  const latest = paid[paid.length - 1]
  return `Paid · ${latest.date}`
}

function getContractEndLabel(expires: string): string {
  if (!expires || expires === '—') return '—'
  const parsed = new Date(expires)
  if (isNaN(parsed.getTime())) return expires
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function getSalesOrderPreviewContext(
  orderId: string,
  listItem: SalesOrderListItem
): SalesOrderPreviewContext {
  const order = salesOrders.find((o) => o.id === orderId) ?? salesOrders[0]
  const account = CUSTOMER_ACCOUNT[listItem.customerId] ?? CUSTOMER_ACCOUNT['pioneer-systems']
  const overrides = PREVIEW_OVERRIDES[orderId] ?? {}
  const nextLine = getNextBillingLine(order)
  const latestActivity = order.activity[order.activity.length - 1]

  return {
    customerSince: account.since,
    customerTenure: account.tenure,
    paymentTerms: 'Net 30',
    avgAnnualValue: order.avgAnnualValue,
    accountOwner: account.owner,
    paymentBehaviour: overrides.paymentBehaviour ?? 'Pays on time',
    paymentBehaviourTone: overrides.paymentBehaviourTone ?? 'positive',
    paymentBehaviourDetail:
      overrides.paymentBehaviourDetail ?? 'All invoices paid within payment terms',
    nextInvoiceAmount: overrides.nextInvoiceAmount ?? nextLine?.amount ?? '—',
    nextInvoiceDate: overrides.nextInvoiceDate ?? nextLine?.billDate ?? '—',
    openBalance: overrides.openBalance ?? getOpenBalance(order),
    openBalanceSub: overrides.openBalanceSub,
    paymentTermsSub: overrides.paymentTermsSub,
    paymentMethod: overrides.paymentMethod ?? '—',
    paymentMethodSub: overrides.paymentMethodSub,
    lastPayment: overrides.lastPayment ?? getLastPaidInvoice(order),
    lastPaymentSub: overrides.lastPaymentSub,
    contractEnd: overrides.contractEnd ?? getContractEndLabel(listItem.expires),
    contractEndSub: overrides.contractEndSub ?? order.renewalAction,
    activityFooter:
      overrides.activityFooter ??
      (latestActivity ? `${latestActivity.label} · ${latestActivity.date}` : 'No recent activity'),
    renewalWindow: overrides.renewalWindow ?? order.renewalAction,
  }
}

export const PAYMENT_BEHAVIOUR_STYLES: Record<
  PaymentBehaviourTone,
  { bg: string; text: string }
> = {
  positive: { bg: 'bg-green-50', text: 'text-green-700' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
  negative: { bg: 'bg-red-50', text: 'text-red-700' },
  neutral: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

// ── V1 payment attention summary (Sales Order details) ──

export type InvoiceTimingTone = 'positive' | 'warning' | 'danger' | 'muted'

export interface RecentInvoiceRow {
  invoiceId: string
  amount: string
  timingLabel: string
  timingTone: InvoiceTimingTone
}

export interface SalesOrderPaymentSummary {
  overdueDays: number
  overdueAmount: string
  overdueInvoiceId: string
  patternSummary: string
  patternSummaryShort?: string
  recentInvoices: RecentInvoiceRow[]
  cardOnFile: string
  cardOnFileSub?: string
  lastPayment: string
  lastPaymentSub?: string
  nextBilling: string
  nextBillingSub?: string
  paymentTerms: string
  paymentTermsSub?: string
  billingContact: string
  billingContactSub?: string
}

function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr)
  if (isNaN(due.getTime())) return 0
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDue.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 0)
}

const PAYMENT_SUMMARY_OVERRIDES: Partial<Record<string, Omit<SalesOrderPaymentSummary, 'overdueDays'> & { overdueDueDate?: string; overdueDays?: number }>> = {
  'so-pioneer-0153': {
    overdueDueDate: 'July 1, 2026',
    overdueAmount: '$126,000.00',
    overdueInvoiceId: 'INV-2026-9584',
    patternSummary:
      'Pioneer Systems typically pays within Net 30 — median clearance is 3 days after due. Four of the last five invoices were on time; the open balance is the first overdue invoice in 14 months.',
    patternSummaryShort:
      'First overdue invoice in 14 months — customer typically pays within Net 30.',
    recentInvoices: [
      { invoiceId: 'INV-2026-9584', amount: '$126,000.00', timingLabel: 'Overdue', timingTone: 'danger' },
      { invoiceId: 'INV-2026-8847', amount: '$54,000.00', timingLabel: 'On time', timingTone: 'positive' },
      { invoiceId: 'INV-2026-0042', amount: '$41,000.00', timingLabel: 'On time', timingTone: 'positive' },
      { invoiceId: 'INV-2026-0312', amount: '$41,000.00', timingLabel: 'On time', timingTone: 'positive' },
      { invoiceId: 'INV-2025-9910', amount: '$38,500.00', timingLabel: 'Late · 2 days', timingTone: 'warning' },
    ],
    cardOnFile: 'Visa ····4291',
    cardOnFileSub: 'Expires Jul 2026',
    lastPayment: 'May 1, 2026',
    lastPaymentSub: 'On time · cleared in 3 days',
    nextBilling: '$41,000.00',
    nextBillingSub: 'Aug 31, 2026',
    paymentTerms: 'Net 30',
    paymentTermsSub: '26 days outstanding on open invoice',
    billingContact: 'Alex Nguyen',
    billingContactSub: 'alex.nguyen@pioneersystems.com',
  },
}

export interface UsageTermRow {
  billingTerm: string
  included: string
  onDemand: string
  includedTone?: 'default' | 'warning' | 'danger'
}

export interface UsageAttentionSignal {
  headline: string
  summary: string
  summaryShort?: string
  ctaLabel: string
  usagePattern: UsageTermRow[]
}

const USAGE_ATTENTION_OVERRIDES: Partial<Record<string, UsageAttentionSignal>> = {
  'so-pioneer-0153': {
    headline: 'Image creation at 91% of monthly cap with 9 days left in the cycle',
    summary:
      'Image usage has climbed steadily over the past three billing cycles — from 1,420 to 1,890 to 2,273 images. Pioneer Systems typically consumes 70–85 images per day in the second half of each cycle, with spikes after product launches. This pattern suggests sustained growth, not a one-off burst.',
    summaryShort:
      'Usage up three cycles in a row — sustained growth, not a one-off spike.',
    ctaLabel: 'View upgrade options',
    usagePattern: [
      { billingTerm: 'Jul 2026', included: '2,273/2,500', onDemand: '0', includedTone: 'warning' },
      { billingTerm: 'Jun 2026', included: '2,500/2,500', onDemand: '342', includedTone: 'danger' },
      { billingTerm: 'May 2026', included: '1,890/2,500', onDemand: '0' },
      { billingTerm: 'Apr 2026', included: '1,620/2,500', onDemand: '0' },
      { billingTerm: 'Mar 2026', included: '1,420/2,500', onDemand: '0' },
    ],
  },
}

export function getUsageAttentionSignal(orderId: string): UsageAttentionSignal | null {
  return USAGE_ATTENTION_OVERRIDES[orderId] ?? null
}

export function getSalesOrderPaymentSummary(
  orderId: string,
  listItem: SalesOrderListItem
): SalesOrderPaymentSummary {
  const context = getSalesOrderPreviewContext(orderId, listItem)
  const override = PAYMENT_SUMMARY_OVERRIDES[orderId]

  if (override) {
    const overdueDays =
      override.overdueDays ??
      (override.overdueDueDate ? getDaysOverdue(override.overdueDueDate) : 0)
    const recentInvoices = override.recentInvoices.map((row, idx) => {
      if (idx === 0 && row.timingLabel === 'Overdue' && overdueDays > 0) {
        return {
          ...row,
          timingLabel: overdueDays === 1 ? 'Overdue · 1 day' : `Overdue · ${overdueDays} days`,
        }
      }
      return row
    })
    return {
      overdueDays,
      overdueAmount: override.overdueAmount,
      overdueInvoiceId: override.overdueInvoiceId,
      patternSummary: override.patternSummary,
      patternSummaryShort: override.patternSummaryShort,
      recentInvoices,
      cardOnFile: override.cardOnFile,
      cardOnFileSub: override.cardOnFileSub,
      lastPayment: override.lastPayment,
      lastPaymentSub: override.lastPaymentSub,
      nextBilling: override.nextBilling,
      nextBillingSub: override.nextBillingSub,
      paymentTerms: override.paymentTerms,
      paymentTermsSub: override.paymentTermsSub,
      billingContact: override.billingContact,
      billingContactSub: override.billingContactSub,
    }
  }

  const order = salesOrders.find((o) => o.id === orderId) ?? salesOrders[0]
  const pending = order.pastInvoices.find((inv) => inv.status === 'Pending')
  const recentInvoices: RecentInvoiceRow[] = order.pastInvoices.slice(-5).reverse().map((inv) => ({
    invoiceId: inv.invoiceId,
    amount: inv.amount,
    timingLabel:
      inv.status === 'Paid' ? 'On time' : inv.status === 'Pending' ? 'Pending' : inv.status,
    timingTone:
      inv.status === 'Paid' ? 'positive' : inv.status === 'Pending' ? 'danger' : 'muted',
  }))

  const billing = BILLING_CONTACT[listItem.customerId]

  return {
    overdueDays: 0,
    overdueAmount: pending?.amount ?? '—',
    overdueInvoiceId: pending?.invoiceId ?? '—',
    patternSummary: context.paymentBehaviourDetail,
    recentInvoices,
    cardOnFile: context.paymentMethod ?? '—',
    cardOnFileSub: context.paymentMethodSub,
    lastPayment: context.lastPayment,
    lastPaymentSub: context.lastPaymentSub,
    nextBilling: context.nextInvoiceAmount,
    nextBillingSub: context.nextInvoiceDate !== '—' ? context.nextInvoiceDate : undefined,
    paymentTerms: context.paymentTerms,
    paymentTermsSub: context.paymentTermsSub,
    billingContact: billing?.name ?? '—',
    billingContactSub: billing?.email,
  }
}
