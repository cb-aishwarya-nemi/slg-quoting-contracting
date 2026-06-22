// ─────────────────────────────────────────────────────────────────────────────
// Contract Processing mock data — Pioneer Systems "New Deal"
// This drives the Customer 360 contract-processing frame that opens after the
// "Process Contract" action in the Customer Link modal.
// ─────────────────────────────────────────────────────────────────────────────

export type SectionStatus = 'ready' | 'attention' | 'ai'

export interface LabelValue {
  label: string
  value: string
  /** If provided, renders as a dropdown select instead of text input */
  options?: string[]
}

export interface ProductLineItem {
  id: string
  name: string
  /** unresolved items are rendered as blue links with an alert icon */
  status: 'ready' | 'attention'
  billingPeriod: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

export interface Comment {
  id: string
  author: string
  initials: string
  isAI?: boolean
  timestamp: string
  body: string
  /** section this comment is linked to (renders as a grey tag) */
  linkedSection?: string
  /** in-page section id this comment maps to (drives scroll + active-section peek) */
  linkedSectionId?: string
  actions?: { label: string; primary?: boolean }[]
}

export interface SourceDocument {
  id: string
  name: string
}

export interface SectionSource {
  id: string
  docName: string
  pageLabel: string
  highlightId: string
  caption: string
}

export const sectionSources: Record<string, SectionSource[]> = {
  account: [
    {
      id: 'src-acc-1',
      docName: 'MSA_2026_PS_001.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-parties',
      caption: 'Parties',
    },
    {
      id: 'src-acc-2',
      docName: 'MSA_2026_PS_001.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-contact',
      caption: 'Contact info',
    },
  ],
  addresses: [
    {
      id: 'src-addr-1',
      docName: 'MSA_2026_PS_001.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-customer-address',
      caption: 'Customer address',
    },
  ],
  terms: [
    {
      id: 'src-term-1',
      docName: 'MSA_2026_PS_001.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-payment-terms',
      caption: 'Payment terms',
    },
    {
      id: 'src-term-2',
      docName: 'MSA_2026_PS_001.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-term-renewal',
      caption: 'Term & renewal',
    },
    {
      id: 'src-term-3',
      docName: 'Schedule_a_pricing.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-billing-schedule',
      caption: 'Billing schedule',
    },
  ],
  products: [
    {
      id: 'src-prod-1',
      docName: 'Schedule_a_pricing.pdf',
      pageLabel: 'Page 1',
      highlightId: 'sec-products',
      caption: 'Products & pricing',
    },
  ],
}

export const contractProcessing = {
  customerName: 'Pioneer Systems',
  dealTag: 'NEW DEAL',
  environment: 'Echocorp.test.chargebee.com',

  processing: {
    title: 'Contract processing…',
    sectionsReady: 3,
    sectionsTotal: 4,
    status: 'Awaiting data',
  },

  summary: {
    contractValue: '$492,000.00',
    headline:
      ', 36-month MSA with Pioneer Systems covering 5 line items — Growth services (50 seats), Onboarding & Training, and more.',
    effectiveDate: 'May 1, 2026',
  },

  account: [
    { label: 'Account', value: 'Pioneer Systems' },
    { label: 'Legal entity', value: 'Pioneer Systems Corp.' },
    { label: 'Contact name', value: 'Alex Nguyen' },
    { label: 'Email', value: 'alex.nguyen@pioneersystems.com' },
    { label: 'Phone', value: '+1 (415) 555 0142' },
    { label: 'Industry', value: 'Industrial automation' },
  ] as LabelValue[],

  addresses: [
    { label: 'Billing contact', value: 'Alex Nguyen' },
    { label: 'Address line 1', value: '340 Market Street, Suite 500' },
    { label: 'City', value: 'San Francisco' },
    { label: 'State / region', value: 'California' },
    { label: 'Postal code', value: '94103' },
    { label: 'Country', value: 'United States' },
  ] as LabelValue[],

  termsAndBilling: [
    { 
      label: 'Billing frequency', 
      value: 'Quarterly',
      options: ['Monthly', 'Quarterly', 'Annual, billed upfront', 'Annual, billed monthly', 'One-time']
    },
    { 
      label: 'Payment terms', 
      value: 'Net 30',
      options: ['Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90']
    },
    { 
      label: 'Contract term', 
      value: '36 months',
      options: ['Month-to-month', '6 months', '12 months', '24 months', '36 months']
    },
    { label: 'Effective date', value: 'May 1, 2026' },
    { label: 'End date', value: 'April 30, 2029' },
    { 
      label: 'Auto-renewal', 
      value: 'No',
      options: ['Yes', 'No']
    },
    { 
      label: 'Currency', 
      value: 'USD — US Dollar',
      options: ['USD — US Dollar', 'EUR — Euro', 'GBP — British Pound', 'CAD — Canadian Dollar', 'AUD — Australian Dollar']
    },
  ] as LabelValue[],

  products: [
    {
      id: 'li-1',
      name: 'Apex platform - growth services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '50',
      unitPrice: '$2,400.00',
      totalPrice: '$120,000.00',
    },
    {
      id: 'li-2',
      name: 'Implementation services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$18,000.00',
      totalPrice: '$18,000.00',
    },
    {
      id: 'li-3',
      name: 'Onboarding & Training',
      status: 'attention',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$9,500.00',
      totalPrice: '$9,500.00',
    },
    {
      id: 'li-4',
      name: 'Premium support SLA',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$12,000.00',
      totalPrice: '$12,000.00',
    },
    {
      id: 'li-5',
      name: 'Sandbox environments',
      status: 'attention',
      billingPeriod: 'Yearly',
      quantity: '03',
      unitPrice: '$1,500.00',
      totalPrice: '$4,500.00',
    },
  ] as ProductLineItem[],

  invoice: {
    number: 'INV-DRAFT-2026-0042',
    issueDate: 'May 1, 2026',
    dueDate: 'May 31, 2026',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 1, Q1)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 1, Q1)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 1, Q1)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 1, Q1)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 1, Q1)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 1 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },

  sourceDocuments: [
    { id: 'doc-1', name: 'MSA_2026_PS_001.pdf' },
    { id: 'doc-2', name: 'Schedule_a_pricing.pdf' },
    { id: 'doc-3', name: 'Addendum_Terms.pdf' },
  ] as SourceDocument[],

  comments: [
    {
      id: 'c-1',
      author: 'Adrian Brody',
      initials: 'A',
      timestamp: 'Just now',
      body: 'I reviewed all 4 sections extracted from the three contract documents. Account, addresses and billing terms are consistent across the MSA and Schedule.',
      linkedSection: 'Account',
      linkedSectionId: 'account',
    },
    {
      id: 'c-2',
      author: 'Apex AI',
      initials: 'AI',
      isAI: true,
      timestamp: 'Just now',
      body: 'I couldn\u2019t match \u201COnboarding & Training\u201D to your product catalog. The closest item is \u201COnboarding Services\u201D (94% match).',
      linkedSection: 'Products and pricing',
      linkedSectionId: 'products',
      actions: [
        { label: 'Map item', primary: true },
        { label: 'Create new' },
      ],
    },
    {
      id: 'c-3',
      author: 'Adrian Brody',
      initials: 'A',
      timestamp: 'Just now',
      body: 'Flagging the contract summary for a second look — the headline value matches the schedule once both unresolved items are mapped.',
      linkedSection: 'Contract summary',
      linkedSectionId: 'summary',
    },
    {
      id: 'c-4',
      author: 'Apex AI',
      initials: 'AI',
      isAI: true,
      timestamp: 'Just now',
      body: '\u201CSandbox environments\u201D isn\u2019t in your catalog yet. Closest match is \u201CSandbox add-on\u201D (88% match).',
      linkedSection: 'Products and pricing',
      linkedSectionId: 'products',
      actions: [
        { label: 'Map item', primary: true },
        { label: 'Create new' },
      ],
    },
    {
      id: 'c-5',
      author: 'Adrian Brody',
      initials: 'A',
      timestamp: 'Just now',
      body: 'Billing terms look good — Net 30, annual upfront. No changes needed before approval.',
      linkedSection: 'Terms and billing',
      linkedSectionId: 'terms',
    },
  ] as Comment[],
}

export type ContractProcessing = typeof contractProcessing

// Line item catalog for the search popover
export interface CatalogLineItem {
  id: string
  name: string
  family: string
  unitPrice: string
}

// Payment schedule data for simulating contract payments over time
export interface PaymentScheduleItem {
  id: string
  period: string
  dueDate: string
  amount: string
  status: 'paid' | 'pending' | 'upcoming'
  invoiceId: string
}

export interface ScheduledInvoice {
  number: string
  issueDate: string
  dueDate: string
  billTo: {
    company: string
    contact: string
    line1: string
    cityLine: string
    country: string
  }
  lineItems: {
    name: string
    qty: string
    unitPrice: string
    amount: string
  }[]
  subtotal: string
  tax: string
  total: string
  notes: string
}

export const paymentSchedule: PaymentScheduleItem[] = [
  {
    id: 'ps-1',
    period: 'Year 1 - Q1',
    dueDate: 'May 31, 2026',
    amount: '$41,000.00',
    status: 'pending',
    invoiceId: 'INV-2026-0042',
  },
  {
    id: 'ps-2',
    period: 'Year 1 - Q2',
    dueDate: 'Aug 31, 2026',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2026-0043',
  },
  {
    id: 'ps-3',
    period: 'Year 1 - Q3',
    dueDate: 'Nov 30, 2026',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2026-0044',
  },
  {
    id: 'ps-4',
    period: 'Year 1 - Q4',
    dueDate: 'Feb 28, 2027',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2026-0045',
  },
  {
    id: 'ps-5',
    period: 'Year 2 - Q1',
    dueDate: 'May 31, 2027',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2027-0046',
  },
  {
    id: 'ps-6',
    period: 'Year 2 - Q2',
    dueDate: 'Aug 31, 2027',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2027-0047',
  },
  {
    id: 'ps-7',
    period: 'Year 2 - Q3',
    dueDate: 'Nov 30, 2027',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2027-0048',
  },
  {
    id: 'ps-8',
    period: 'Year 2 - Q4',
    dueDate: 'Feb 28, 2028',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2027-0049',
  },
  {
    id: 'ps-9',
    period: 'Year 3 - Q1',
    dueDate: 'May 31, 2028',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2028-0050',
  },
  {
    id: 'ps-10',
    period: 'Year 3 - Q2',
    dueDate: 'Aug 31, 2028',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2028-0051',
  },
  {
    id: 'ps-11',
    period: 'Year 3 - Q3',
    dueDate: 'Nov 30, 2028',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2028-0052',
  },
  {
    id: 'ps-12',
    period: 'Year 3 - Q4',
    dueDate: 'Feb 28, 2029',
    amount: '$41,000.00',
    status: 'upcoming',
    invoiceId: 'INV-2028-0053',
  },
]

export const scheduledInvoices: Record<string, ScheduledInvoice> = {
  'INV-2026-0042': {
    number: 'INV-2026-0042',
    issueDate: 'May 1, 2026',
    dueDate: 'May 31, 2026',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 1, Q1)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 1, Q1)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 1, Q1)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 1, Q1)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 1, Q1)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 1 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2026-0043': {
    number: 'INV-2026-0043',
    issueDate: 'Aug 1, 2026',
    dueDate: 'Aug 31, 2026',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 1, Q2)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 1, Q2)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 1, Q2)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 1, Q2)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 1, Q2)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 2 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2026-0044': {
    number: 'INV-2026-0044',
    issueDate: 'Nov 1, 2026',
    dueDate: 'Nov 30, 2026',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 1, Q3)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 1, Q3)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 1, Q3)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 1, Q3)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 1, Q3)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 3 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2026-0045': {
    number: 'INV-2026-0045',
    issueDate: 'Feb 1, 2027',
    dueDate: 'Feb 28, 2027',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 1, Q4)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 1, Q4)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 1, Q4)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 1, Q4)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 1, Q4)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 4 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2027-0046': {
    number: 'INV-2027-0046',
    issueDate: 'May 1, 2027',
    dueDate: 'May 31, 2027',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 2, Q1)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 2, Q1)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 2, Q1)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 2, Q1)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 2, Q1)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 5 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2027-0047': {
    number: 'INV-2027-0047',
    issueDate: 'Aug 1, 2027',
    dueDate: 'Aug 31, 2027',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 2, Q2)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 2, Q2)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 2, Q2)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 2, Q2)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 2, Q2)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 6 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2027-0048': {
    number: 'INV-2027-0048',
    issueDate: 'Nov 1, 2027',
    dueDate: 'Nov 30, 2027',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 2, Q3)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 2, Q3)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 2, Q3)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 2, Q3)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 2, Q3)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 7 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2027-0049': {
    number: 'INV-2027-0049',
    issueDate: 'Feb 1, 2028',
    dueDate: 'Feb 28, 2028',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 2, Q4)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 2, Q4)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 2, Q4)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 2, Q4)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 2, Q4)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 8 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2028-0050': {
    number: 'INV-2028-0050',
    issueDate: 'May 1, 2028',
    dueDate: 'May 31, 2028',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 3, Q1)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 3, Q1)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 3, Q1)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 3, Q1)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 3, Q1)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 9 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2028-0051': {
    number: 'INV-2028-0051',
    issueDate: 'Aug 1, 2028',
    dueDate: 'Aug 31, 2028',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 3, Q2)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 3, Q2)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 3, Q2)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 3, Q2)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 3, Q2)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 10 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2028-0052': {
    number: 'INV-2028-0052',
    issueDate: 'Nov 1, 2028',
    dueDate: 'Nov 30, 2028',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 3, Q3)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 3, Q3)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 3, Q3)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 3, Q3)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 3, Q3)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 11 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
  'INV-2028-0053': {
    number: 'INV-2028-0053',
    issueDate: 'Feb 1, 2029',
    dueDate: 'Feb 28, 2029',
    billTo: {
      company: 'Pioneer Systems Corp.',
      contact: 'Alex Nguyen',
      line1: '340 Market Street, Suite 500',
      cityLine: 'San Francisco, CA 94103',
      country: 'United States',
    },
    lineItems: [
      { name: 'Apex platform - growth services (Year 3, Q4)', qty: '50', unitPrice: '$600.00', amount: '$30,000.00' },
      { name: 'Implementation services (Year 3, Q4)', qty: '1', unitPrice: '$4,500.00', amount: '$4,500.00' },
      { name: 'Onboarding & Training (Year 3, Q4)', qty: '1', unitPrice: '$2,375.00', amount: '$2,375.00' },
      { name: 'Premium support SLA (Year 3, Q4)', qty: '1', unitPrice: '$3,000.00', amount: '$3,000.00' },
      { name: 'Sandbox environments (Year 3, Q4)', qty: '3', unitPrice: '$375.00', amount: '$1,125.00' },
    ],
    subtotal: '$41,000.00',
    tax: '$0.00',
    total: '$41,000.00',
    notes: 'Quarterly payment 12 of 12 (36-month contract). Payment due Net 30 from invoice date.',
  },
}

export const lineItemCatalog: CatalogLineItem[] = [
  { id: 'cat-1', name: 'Apex platform - growth services', family: 'Platform Services', unitPrice: '$2,400.00' },
  { id: 'cat-2', name: 'Apex platform - enterprise services', family: 'Platform Services', unitPrice: '$4,800.00' },
  { id: 'cat-3', name: 'Apex platform - starter services', family: 'Platform Services', unitPrice: '$1,200.00' },
  { id: 'cat-4', name: 'Implementation services', family: 'Professional Services', unitPrice: '$18,000.00' },
  { id: 'cat-5', name: 'Onboarding Services', family: 'Professional Services', unitPrice: '$9,500.00' },
  { id: 'cat-6', name: 'Training & Enablement', family: 'Professional Services', unitPrice: '$7,500.00' },
  { id: 'cat-7', name: 'Premium support SLA', family: 'Support', unitPrice: '$12,000.00' },
  { id: 'cat-8', name: 'Enterprise support SLA', family: 'Support', unitPrice: '$24,000.00' },
  { id: 'cat-9', name: 'Standard support SLA', family: 'Support', unitPrice: '$6,000.00' },
  { id: 'cat-10', name: 'Sandbox add-on', family: 'Add-ons', unitPrice: '$1,500.00' },
  { id: 'cat-11', name: 'API access add-on', family: 'Add-ons', unitPrice: '$3,000.00' },
  { id: 'cat-12', name: 'Custom integrations', family: 'Add-ons', unitPrice: '$5,000.00' },
  { id: 'cat-13', name: 'Data migration services', family: 'Professional Services', unitPrice: '$15,000.00' },
  { id: 'cat-14', name: 'Consulting hours', family: 'Professional Services', unitPrice: '$250.00' },
]
