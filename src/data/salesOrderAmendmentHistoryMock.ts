import { type SalesOrderProduct } from '@/data/salesOrderMock'

export interface AmendmentVersionSnapshot {
  id: string
  version: string
  title: string
  detail: string
  date: string
  current?: boolean
  /** Whether this version expands or contracts the deal vs the prior one */
  changeKind?: 'expansion' | 'contraction'
  /** Contract time period for this version */
  timePeriod: {
    startDate: string
    endDate: string
    term: string
  }
  tcv: string
  products: SalesOrderProduct[]
  sourceDocs: { id: string; name: string; type: string }[]
  changeSummary: string
}

/** Newest first — Pioneer All good-2 amendment evolution. */
export const AMENDMENT_HISTORY_VERSIONS: AmendmentVersionSnapshot[] = [
  {
    id: 'v4',
    version: 'v4',
    title: 'Contract expansion',
    detail: 'Extended term',
    date: 'Jul 9, 2026',
    current: true,
    changeKind: 'expansion',
    timePeriod: {
      startDate: 'May 1, 2026',
      endDate: 'Apr 30, 2029',
      term: '36 months',
    },
    tcv: '$492,000.00',
    changeSummary: 'Term extended by a year — the deal now runs through Apr 2029 at $492K TCV.',
    products: [
      {
        id: 'v4-p1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '75',
        unitPrice: '$2,400.00',
        totalPrice: '$180,000.00',
      },
      {
        id: 'v4-p2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'v4-p3',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,000.00',
        totalPrice: '$12,000.00',
      },
      {
        id: 'v4-p4',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '03',
        unitPrice: '$1,500.00',
        totalPrice: '$4,500.00',
      },
    ],
    sourceDocs: [
      { id: 'v4-d1', name: 'Pioneer_Systems_Amendment_3_Extended_Term.pdf', type: 'Amendment' },
      { id: 'v4-d2', name: 'Pioneer_Systems_MSA_2026.pdf', type: 'MSA' },
    ],
  },
  {
    id: 'v3',
    version: 'v3',
    title: 'Contract expansion',
    detail: '+ 25 seats',
    date: 'Mar 1, 2026',
    changeKind: 'expansion',
    timePeriod: {
      startDate: 'May 1, 2026',
      endDate: 'Apr 30, 2028',
      term: '24 months',
    },
    tcv: '$328,000.00',
    changeSummary: 'Platform seats grew from 50 to 75 — the annual platform line stepped up with them.',
    products: [
      {
        id: 'v3-p1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '75',
        unitPrice: '$2,400.00',
        totalPrice: '$180,000.00',
      },
      {
        id: 'v3-p2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'v3-p3',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,000.00',
        totalPrice: '$12,000.00',
      },
      {
        id: 'v3-p4',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '03',
        unitPrice: '$1,500.00',
        totalPrice: '$4,500.00',
      },
    ],
    sourceDocs: [
      { id: 'v3-d1', name: 'Pioneer_Systems_Amendment_2_Seat_Expansion.pdf', type: 'Amendment' },
      { id: 'v3-d2', name: 'Pioneer_Systems_MSA_2026.pdf', type: 'MSA' },
    ],
  },
  {
    id: 'v2',
    version: 'v2',
    title: 'Contract expansion',
    detail: '+25 seats · ramp adjust',
    date: 'Jun 15, 2026',
    changeKind: 'expansion',
    timePeriod: {
      startDate: 'May 1, 2025',
      endDate: 'Apr 30, 2027',
      term: '24 months',
    },
    tcv: '$246,000.00',
    changeSummary:
      'Seats expanded by 25 and Year 2 ramp pricing was nudged +7% — TCV moved from $230K to $246K.',
    products: [
      {
        id: 'v2-p1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '75',
        unitPrice: '$2,400.00',
        totalPrice: '$180,000.00',
        quantityChange: 25,
      },
      {
        id: 'v2-p2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'v2-p3',
        name: 'Onboarding & Training',
        frequency: 'One-time',
        quantity: '01',
        unitPrice: '$9,500.00',
        totalPrice: '$9,500.00',
      },
      {
        id: 'v2-p4',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,840.00',
        totalPrice: '$12,840.00',
        rampPriceChange: 7,
        unitPriceDiff: '+$840.00',
      },
      {
        id: 'v2-p5',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '03',
        unitPrice: '$1,605.00',
        totalPrice: '$4,815.00',
        rampPriceChange: 7,
        unitPriceDiff: '+$105.00',
      },
    ],
    sourceDocs: [
      { id: 'v2-d1', name: 'Pioneer_Systems_Amendment_1_Ramp_Adjust.pdf', type: 'Amendment' },
      { id: 'v2-d2', name: 'Pioneer_Systems_Order_Form_2025.pdf', type: 'Order form' },
    ],
  },
  {
    id: 'v1',
    version: 'v1',
    title: 'Original',
    detail: 'Initial signed order',
    date: 'May 1, 2025',
    timePeriod: {
      startDate: 'May 1, 2025',
      endDate: 'Apr 30, 2027',
      term: '24 months',
    },
    tcv: '$230,000.00',
    changeSummary: 'Initial signed order — 50 seats, 24-month term, quarterly billing.',
    products: [
      {
        id: 'v1-p1',
        name: 'Apex platform - growth services',
        frequency: 'Yearly',
        quantity: '50',
        unitPrice: '$2,400.00',
        totalPrice: '$120,000.00',
      },
      {
        id: 'v1-p2',
        name: 'Implementation services',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$18,000.00',
        totalPrice: '$18,000.00',
      },
      {
        id: 'v1-p3',
        name: 'Onboarding & Training',
        frequency: 'One-time',
        quantity: '01',
        unitPrice: '$9,500.00',
        totalPrice: '$9,500.00',
      },
      {
        id: 'v1-p4',
        name: 'Premium support SLA',
        frequency: 'Yearly',
        quantity: '01',
        unitPrice: '$12,000.00',
        totalPrice: '$12,000.00',
      },
      {
        id: 'v1-p5',
        name: 'Sandbox environments',
        frequency: 'Yearly',
        quantity: '02',
        unitPrice: '$1,500.00',
        totalPrice: '$3,000.00',
      },
    ],
    sourceDocs: [
      { id: 'v1-d1', name: 'Pioneer_Systems_MSA_2025.pdf', type: 'MSA' },
      { id: 'v1-d2', name: 'Pioneer_Systems_Order_Form_2025.pdf', type: 'Order form' },
    ],
  },
]
