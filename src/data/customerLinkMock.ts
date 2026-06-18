export interface ExtractedCustomer {
  companyName: string
  contactName: string
  email: string
  phone?: string
  address?: string
}

export interface CustomerMatch {
  id: string
  name: string
  initials: string
  activeSubscriptions: number
  primaryContact: string
  email: string
  createdAt: string
  matchLabel?: 'Perfect match' | 'Closest match' | 'Match'
  netPayment?: string
}

export interface CreateCustomerDefaults {
  customerId: string
  emailId: string
  firstName: string
  lastName: string
  company: string
  phone: string
  language: string
  currency: string
  autoCollection: 'on' | 'off'
  paymentTerms: string
  doNotSyncInvoices: boolean
  billingAddress: {
    country: string
    firstName: string
    lastName: string
    email: string
    company: string
    phone: string
    addressLine1: string
    addressLine2: string
    addressLine3: string
    city: string
    postalCode: string
  }
}

/**
 * Use Case Variant Types for Customer Link Modal
 */
export type CustomerLinkVariant = 'perfect-match' | 'closest-matches' | 'no-match'

export const extractedCustomer: ExtractedCustomer = {
  companyName: 'Pioneer Systems',
  contactName: 'Alex Nguyen',
  email: 'alex.nguyen@pioneersystems.com',
}

/**
 * VARIANT: Perfect Match
 * Exactly one customer perfectly matches the extracted data
 */
export const perfectMatchCustomers: CustomerMatch[] = [
  {
    id: 'cust-001',
    name: 'Pioneer Systems',
    initials: 'PS',
    activeSubscriptions: 3,
    primaryContact: 'Alex Nguyen',
    email: 'alex.nguyen@pioneersystems.com',
    createdAt: '10 Feb 2026',
    matchLabel: 'Perfect match',
    netPayment: 'Net 30',
  },
]

/**
 * VARIANT: Closest Matches
 * Multiple customers with fuzzy matching (original behavior)
 */
export const closestMatchCustomers: CustomerMatch[] = [
  {
    id: 'cust-001',
    name: 'Pioneer Systems',
    initials: 'PS',
    activeSubscriptions: 2,
    primaryContact: 'Priya Mehta',
    email: 'p.mehta@pioneersystems.com',
    createdAt: '10 Feb 2026',
    matchLabel: 'Closest match',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-002',
    name: 'Pioneer systems',
    initials: 'PS',
    activeSubscriptions: 1,
    primaryContact: 'David Chen',
    email: 'd.chen@pioneersystems.com',
    createdAt: '18 Sept 2025',
    matchLabel: 'Match',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-003',
    name: 'Pinoeer Systems',
    initials: 'PS',
    activeSubscriptions: 0,
    primaryContact: 'Morgan Lee',
    email: 'm.lee@pinoeersystems.com',
    createdAt: '02 Nov 2024',
    matchLabel: 'Match',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-004',
    name: 'Pioneer System',
    initials: 'PS',
    activeSubscriptions: 5,
    primaryContact: 'Rachel Torres',
    email: 'r.torres@pioneer-system.com',
    createdAt: '21 Jun 2023',
    matchLabel: 'Match',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-005',
    name: 'Pioneers Systems',
    initials: 'PS',
    activeSubscriptions: 1,
    primaryContact: 'Samira Patel',
    email: 's.patel@pioneers-systems.com',
    createdAt: '08 Jan 2025',
    matchLabel: 'Match',
    netPayment: 'Net 30',
  },
]

/**
 * VARIANT: No Match Found
 * Empty array - no customers match
 */
export const noMatchCustomers: CustomerMatch[] = []

/**
 * Helper function to get customer matches based on use case variant
 */
export function getCustomerMatchesByVariant(variant: CustomerLinkVariant): CustomerMatch[] {
  switch (variant) {
    case 'perfect-match':
      return perfectMatchCustomers
    case 'closest-matches':
      return closestMatchCustomers
    case 'no-match':
      return noMatchCustomers
    default:
      return closestMatchCustomers
  }
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getCustomerMatchesByVariant instead
 */
export const customerMatches: CustomerMatch[] = closestMatchCustomers

export const allCustomers: CustomerMatch[] = [
  ...customerMatches,
  {
    id: 'cust-006',
    name: 'Atlas BioSystems',
    initials: 'AB',
    activeSubscriptions: 4,
    primaryContact: 'Priya Mehta',
    email: 'p.mehta@atlasbio.com',
    createdAt: '15 Mar 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-007',
    name: 'Beacon Data Co',
    initials: 'BD',
    activeSubscriptions: 2,
    primaryContact: 'Rachel Torres',
    email: 'r.torres@beacondata.io',
    createdAt: '15 Mar 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-008',
    name: 'Cascade Networks',
    initials: 'CN',
    activeSubscriptions: 1,
    primaryContact: 'James Wilson',
    email: 'j.wilson@cascadenet.com',
    createdAt: '22 Apr 2024',
    netPayment: 'Net 45',
  },
  {
    id: 'cust-009',
    name: 'Delta Dynamics',
    initials: 'DD',
    activeSubscriptions: 3,
    primaryContact: 'Sarah Kim',
    email: 's.kim@deltadynamics.io',
    createdAt: '08 May 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-010',
    name: 'Echo Enterprises',
    initials: 'EE',
    activeSubscriptions: 1,
    primaryContact: 'Michael Brown',
    email: 'm.brown@echoent.com',
    createdAt: '17 Jun 2024',
    netPayment: 'Net 60',
  },
  {
    id: 'cust-011',
    name: 'Fusion Tech Labs',
    initials: 'FT',
    activeSubscriptions: 0,
    primaryContact: 'Emily Davis',
    email: 'e.davis@fusiontech.com',
    createdAt: '03 Jul 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-012',
    name: 'Global Innovations',
    initials: 'GI',
    activeSubscriptions: 6,
    primaryContact: 'Chris Martinez',
    email: 'c.martinez@globalinno.com',
    createdAt: '29 Aug 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-013',
    name: 'Horizon Analytics',
    initials: 'HA',
    activeSubscriptions: 2,
    primaryContact: 'Lisa Wang',
    email: 'l.wang@horizonanalytics.com',
    createdAt: '14 Sep 2024',
    netPayment: 'Net 45',
  },
  {
    id: 'cust-014',
    name: 'Infinity Solutions',
    initials: 'IS',
    activeSubscriptions: 3,
    primaryContact: 'David Park',
    email: 'd.park@infinitysol.com',
    createdAt: '01 Oct 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-015',
    name: 'Jupiter Systems',
    initials: 'JS',
    activeSubscriptions: 1,
    primaryContact: 'Anna Thompson',
    email: 'a.thompson@jupitersys.com',
    createdAt: '18 Oct 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-016',
    name: 'Keystone Industries',
    initials: 'KI',
    activeSubscriptions: 4,
    primaryContact: 'Robert Chen',
    email: 'r.chen@keystoneind.com',
    createdAt: '05 Nov 2024',
    netPayment: 'Net 60',
  },
  {
    id: 'cust-017',
    name: 'Lunar Logistics',
    initials: 'LL',
    activeSubscriptions: 2,
    primaryContact: 'Jennifer Lee',
    email: 'j.lee@lunarlog.com',
    createdAt: '22 Nov 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-018',
    name: 'Metro Manufacturing',
    initials: 'MM',
    activeSubscriptions: 0,
    primaryContact: 'Kevin Smith',
    email: 'k.smith@metromfg.com',
    createdAt: '09 Dec 2024',
    netPayment: 'Net 30',
  },
  {
    id: 'cust-019',
    name: 'Nova Networks',
    initials: 'NN',
    activeSubscriptions: 7,
    primaryContact: 'Michelle Garcia',
    email: 'm.garcia@novanet.io',
    createdAt: '26 Dec 2024',
    netPayment: 'Net 45',
  },
  {
    id: 'cust-020',
    name: 'Omega Operations',
    initials: 'OO',
    activeSubscriptions: 1,
    primaryContact: 'Steven Taylor',
    email: 's.taylor@omegaops.com',
    createdAt: '12 Jan 2025',
    netPayment: 'Net 30',
  },
]

export const createCustomerDefaults: CreateCustomerDefaults = {
  customerId: '',
  emailId: 'alex.nguyen@pioneersystems.com',
  firstName: 'Alex',
  lastName: 'Nguyen',
  company: 'Pioneer Systems',
  phone: '+1 (555) 000-0000',
  language: 'English',
  currency: 'USD — US Dollar',
  autoCollection: 'off',
  paymentTerms: 'Net 30 (Site Default)',
  doNotSyncInvoices: false,
  billingAddress: {
    country: 'United States',
    firstName: 'Alex',
    lastName: 'Nguyen',
    email: 'alex.nguyen@pioneersystems.com',
    company: 'Pioneer Systems Corp.',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    postalCode: '',
  },
}
