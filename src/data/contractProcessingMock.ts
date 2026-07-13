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
  /** AI could not extract this field from the source document */
  extractionFailed?: boolean
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
  /** Price change percentage from previous period (e.g., 7 for 7% increase) */
  rampPriceChange?: number
}

export interface RampPeriod {
  id: string
  label: string
  startDate: string
  endDate: string
  items: ProductLineItem[]
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
    termMonths: 24,
    effectiveDate: 'July 13, 2026',
    lineItemsSummary:
      'covering 5 line items — Growth services (50 seats), Onboarding & Training, and more',
  },

  account: [
    { label: 'Account', value: 'Pioneer Systems' },
    {
      label: 'Legal entity',
      value: '',
      extractionFailed: true,
      options: [
        'Pioneer Systems Corp.',
        'Pioneer Systems LLC',
        'Pioneer Systems Inc.',
        'Pioneer Holdings Ltd.',
      ],
    },
    { label: 'Contact name', value: 'Alex Nguyen' },
    { label: 'Email', value: 'alex.nguyen@pioneersystems.com' },
    { label: 'Phone', value: '+1 (415) 555 0142' },
    {
      label: 'Industry',
      value: '',
      extractionFailed: true,
      options: [
        'Industrial automation',
        'Healthcare technology',
        'Financial services',
        'Manufacturing',
        'Data analytics',
        'Other',
      ],
    },
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

  rampPeriods: [
    {
      id: 'period-1',
      label: 'Period 1',
      startDate: '17 Jul 2026',
      endDate: '17 Jun 2028',
      items: [
        {
          id: 'rp1-li-1',
          name: 'Apex platform - growth services',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '50',
          unitPrice: '$2,400.00',
          totalPrice: '$120,000.00',
        },
        {
          id: 'rp1-li-2',
          name: 'Implementation services',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$18,000.00',
          totalPrice: '$18,000.00',
        },
        {
          id: 'rp1-li-3',
          name: 'Onboarding & Training',
          status: 'attention',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$9,500.00',
          totalPrice: '$9,500.00',
        },
        {
          id: 'rp1-li-4',
          name: 'Premium support SLA',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$12,000.00',
          totalPrice: '$12,000.00',
        },
        {
          id: 'rp1-li-5',
          name: 'Sandbox environments',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '03',
          unitPrice: '$1,500.00',
          totalPrice: '$4,500.00',
        },
      ] as ProductLineItem[],
    },
    {
      id: 'period-2',
      label: 'Period 2',
      startDate: '17 Jul 2027',
      endDate: '17 Jul 2028',
      items: [
        {
          id: 'rp2-li-1',
          name: 'Apex platform - growth services',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '50',
          unitPrice: '$2,568.00',
          totalPrice: '$128,400.00',
          rampPriceChange: 7,
        },
        {
          id: 'rp2-li-2',
          name: 'Implementation services',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$18,000.00',
          totalPrice: '$18,000.00',
        },
        {
          id: 'rp2-li-3',
          name: 'Onboarding & Training',
          status: 'attention',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$10,165.00',
          totalPrice: '$10,165.00',
          rampPriceChange: 7,
        },
        {
          id: 'rp2-li-4',
          name: 'Premium support SLA',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '01',
          unitPrice: '$12,840.00',
          totalPrice: '$12,840.00',
        },
        {
          id: 'rp2-li-5',
          name: 'Sandbox environments',
          status: 'ready',
          billingPeriod: 'Yearly',
          quantity: '03',
          unitPrice: '$1,605.00',
          totalPrice: '$4,815.00',
        },
      ] as ProductLineItem[],
    },
  ] as RampPeriod[],

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
    {
      id: 'c-6',
      author: 'Adrian Brody',
      initials: 'A',
      timestamp: '2 min ago',
      body: 'Double-checked the product quantities against the schedule — all line items match.',
      linkedSection: 'Products and pricing',
      linkedSectionId: 'products',
    },
    {
      id: 'c-7',
      author: 'Apex AI',
      initials: 'AI',
      isAI: true,
      timestamp: '5 min ago',
      body: 'Invoice preview generated based on Q1 billing schedule. Tax calculation uses default 0% rate — confirm tax exemption status before sending.',
      linkedSection: 'Invoice preview',
      linkedSectionId: 'invoice',
    },
  ] as Comment[],
}

export type ContractProcessing = Omit<typeof contractProcessing, 'summary'> & {
  summary: {
    contractValue: string
    termMonths: number
    effectiveDate: string
    lineItemsSummary?: string
  }
}

// Additional contract data for navigation demo
export const verdantHealthContract: ContractProcessing = {
  customerName: 'Verdant Health',
  dealTag: 'EARLY RENEWAL',
  environment: 'Echocorp.test.chargebee.com',

  processing: {
    title: 'Contract processing…',
    sectionsReady: 4,
    sectionsTotal: 4,
    status: 'Ready for review',
  },

  summary: {
    contractValue: '$720,000.00',
    termMonths: 36,
    effectiveDate: 'June 1, 2026',
  },

  account: [
    { label: 'Account', value: 'Verdant Health' },
    { label: 'Legal entity', value: 'Verdant Health Systems Inc.' },
    { label: 'Contact name', value: 'Dr. Sarah Chen' },
    { label: 'Email', value: 'sarah.chen@verdanthealth.com' },
    { label: 'Phone', value: '+1 (617) 555 0198' },
    { label: 'Industry', value: 'Healthcare Technology' },
  ] as LabelValue[],

  addresses: [
    { label: 'Billing contact', value: 'Dr. Sarah Chen' },
    { label: 'Address line 1', value: '100 Longwood Avenue, Floor 12' },
    { label: 'City', value: 'Boston' },
    { label: 'State / region', value: 'Massachusetts' },
    { label: 'Postal code', value: '02115' },
    { label: 'Country', value: 'United States' },
  ] as LabelValue[],

  termsAndBilling: contractProcessing.termsAndBilling,
  products: [
    {
      id: 'vh-1',
      name: 'Apex platform - enterprise services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '200',
      unitPrice: '$4,800.00',
      totalPrice: '$960,000.00',
    },
    {
      id: 'vh-2',
      name: 'Enterprise support SLA',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$24,000.00',
      totalPrice: '$24,000.00',
    },
    {
      id: 'vh-3',
      name: 'HIPAA compliance module',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$36,000.00',
      totalPrice: '$36,000.00',
    },
  ] as ProductLineItem[],

  invoice: contractProcessing.invoice,
  sourceDocuments: contractProcessing.sourceDocuments,
  rampPeriods: [],
  comments: [] as Comment[],
}

export const zenithAnalyticsContract: ContractProcessing = {
  customerName: 'Zenith Analytics Inc.',
  dealTag: 'NEW DEAL',
  environment: 'Echocorp.test.chargebee.com',

  processing: {
    title: 'Contract processing…',
    sectionsReady: 3,
    sectionsTotal: 4,
    status: 'Ready for review',
  },

  summary: {
    contractValue: '$255,000.00',
    termMonths: 24,
    effectiveDate: 'July 1, 2026',
  },

  account: [
    { label: 'Account', value: 'Zenith Analytics Inc.' },
    { label: 'Legal entity', value: 'Zenith Analytics Corporation' },
    { label: 'Contact name', value: 'Marcus Webb' },
    { label: 'Email', value: 'marcus.webb@zenithanalytics.io' },
    { label: 'Phone', value: '+1 (512) 555 0234' },
    { label: 'Industry', value: 'Data Analytics' },
  ] as LabelValue[],

  addresses: [
    { label: 'Billing contact', value: 'Marcus Webb' },
    { label: 'Address line 1', value: '500 Congress Avenue, Suite 800' },
    { label: 'City', value: 'Austin' },
    { label: 'State / region', value: 'Texas' },
    { label: 'Postal code', value: '78701' },
    { label: 'Country', value: 'United States' },
  ] as LabelValue[],

  termsAndBilling: contractProcessing.termsAndBilling,
  products: [
    {
      id: 'za-1',
      name: 'Apex platform - growth services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '75',
      unitPrice: '$2,400.00',
      totalPrice: '$180,000.00',
    },
    {
      id: 'za-2',
      name: 'Implementation services',
      status: 'ready',
      billingPeriod: 'One-time',
      quantity: '01',
      unitPrice: '$25,000.00',
      totalPrice: '$25,000.00',
    },
    {
      id: 'za-3',
      name: 'Data migration services',
      status: 'attention',
      billingPeriod: 'One-time',
      quantity: '01',
      unitPrice: '$15,000.00',
      totalPrice: '$15,000.00',
    },
  ] as ProductLineItem[],

  invoice: contractProcessing.invoice,
  sourceDocuments: contractProcessing.sourceDocuments,
  rampPeriods: [],
  comments: [] as Comment[],
}

export const quantumInnovationsContract: ContractProcessing = {
  customerName: 'Quantum Innovations',
  dealTag: 'NEW DEAL',
  environment: 'Echocorp.test.chargebee.com',

  processing: {
    title: 'Contract processing…',
    sectionsReady: 4,
    sectionsTotal: 4,
    status: 'Pending approval',
  },

  summary: {
    contractValue: '$1,260,000.00',
    termMonths: 36,
    effectiveDate: 'August 1, 2026',
  },

  account: [
    { label: 'Account', value: 'Quantum Innovations' },
    { label: 'Legal entity', value: 'Quantum Innovations Ltd.' },
    { label: 'Contact name', value: 'Elena Rodriguez' },
    { label: 'Email', value: 'elena.rodriguez@quantuminnovations.com' },
    { label: 'Phone', value: '+1 (650) 555 0876' },
    { label: 'Industry', value: 'Quantum Computing' },
  ] as LabelValue[],

  addresses: [
    { label: 'Billing contact', value: 'Elena Rodriguez' },
    { label: 'Address line 1', value: '1600 Amphitheatre Parkway' },
    { label: 'City', value: 'Mountain View' },
    { label: 'State / region', value: 'California' },
    { label: 'Postal code', value: '94043' },
    { label: 'Country', value: 'United States' },
  ] as LabelValue[],

  termsAndBilling: contractProcessing.termsAndBilling,
  products: [
    {
      id: 'qi-1',
      name: 'Apex platform - enterprise services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '200',
      unitPrice: '$4,800.00',
      totalPrice: '$960,000.00',
    },
    {
      id: 'qi-2',
      name: 'Enterprise support SLA',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$24,000.00',
      totalPrice: '$24,000.00',
    },
    {
      id: 'qi-3',
      name: 'Custom integrations',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '05',
      unitPrice: '$5,000.00',
      totalPrice: '$25,000.00',
    },
  ] as ProductLineItem[],

  invoice: contractProcessing.invoice,
  sourceDocuments: contractProcessing.sourceDocuments,
  rampPeriods: [],
  comments: [] as Comment[],
}

export const nexusPaymentsContract: ContractProcessing = {
  customerName: 'Nexus Payments',
  dealTag: 'EARLY RENEWAL',
  environment: 'Echocorp.test.chargebee.com',

  processing: {
    title: 'Contract processing…',
    sectionsReady: 3,
    sectionsTotal: 4,
    status: 'In review',
  },

  summary: {
    contractValue: '$540,000.00',
    termMonths: 24,
    effectiveDate: 'September 1, 2026',
  },

  account: [
    { label: 'Account', value: 'Nexus Payments' },
    { label: 'Legal entity', value: 'Nexus Payments Corp.' },
    { label: 'Contact name', value: 'James Park' },
    { label: 'Email', value: 'james.park@nexuspayments.io' },
    { label: 'Phone', value: '+1 (212) 555 0432' },
    { label: 'Industry', value: 'Financial Services' },
  ] as LabelValue[],

  addresses: [
    { label: 'Billing contact', value: 'James Park' },
    { label: 'Address line 1', value: '200 Park Avenue, Floor 40' },
    { label: 'City', value: 'New York' },
    { label: 'State / region', value: 'New York' },
    { label: 'Postal code', value: '10166' },
    { label: 'Country', value: 'United States' },
  ] as LabelValue[],

  termsAndBilling: contractProcessing.termsAndBilling,
  products: [
    {
      id: 'np-1',
      name: 'Apex platform - growth services',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '100',
      unitPrice: '$2,400.00',
      totalPrice: '$240,000.00',
    },
    {
      id: 'np-2',
      name: 'Premium support SLA',
      status: 'ready',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$12,000.00',
      totalPrice: '$12,000.00',
    },
    {
      id: 'np-3',
      name: 'API access add-on',
      status: 'attention',
      billingPeriod: 'Yearly',
      quantity: '01',
      unitPrice: '$3,000.00',
      totalPrice: '$3,000.00',
    },
  ] as ProductLineItem[],

  invoice: contractProcessing.invoice,
  sourceDocuments: contractProcessing.sourceDocuments,
  rampPeriods: [],
  comments: [] as Comment[],
}

// Map workbench item IDs to contract data
export const contractsById: Record<number, ContractProcessing> = {
  100: contractProcessing,        // Pioneer Systems
  1: verdantHealthContract,       // Verdant Health
  3: zenithAnalyticsContract,     // Zenith Analytics Inc.
  16: quantumInnovationsContract, // Quantum Innovations
  19: nexusPaymentsContract,      // Nexus Payments
}

// Helper function to get contract data by workbench item ID
export function getContractById(id: number): ContractProcessing {
  return contractsById[id] ?? contractProcessing
}

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
