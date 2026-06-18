// ─────────────────────────────────────────────────────────────────────────────
// All Contracts list mock data — Pioneer Systems
// ─────────────────────────────────────────────────────────────────────────────

export type ContractStatus = 'Pending Approval' | 'Active' | 'Expired' | 'Draft' | 'Cancelled'

export interface ContractListItem {
  id: string
  contractId: string
  status: ContractStatus
  type: 'MSA' | 'Amendment' | 'Renewal' | 'SOW'
  value: string
  effectiveDate: string
  endDate: string
  term: string
  autoRenew: 'Yes' | 'No'
}

export interface ContractListStat {
  value: string
  label: string
}

export const contractListData = {
  customerName: 'Pioneer Systems',

  stats: [
    { value: '$164,000', label: 'Total contract value' },
    { value: '1', label: 'Pending approval' },
    { value: '12 months', label: 'Avg. contract term' },
    { value: 'May 1, 2026', label: 'Latest effective date' },
  ] as ContractListStat[],

  contracts: [
    {
      id: 'con-1',
      contractId: 'CON-2026-9584',
      status: 'Pending Approval',
      type: 'MSA',
      value: '$164,000.00',
      effectiveDate: 'May 1, 2026',
      endDate: 'April 30, 2027',
      term: '12 months',
      autoRenew: 'No',
    },
    {
      id: 'con-2',
      contractId: 'CON-2026-8847',
      status: 'Active',
      type: 'MSA',
      value: '$216,000.00',
      effectiveDate: 'Jan 1, 2026',
      endDate: 'Dec 31, 2026',
      term: '12 months',
      autoRenew: 'Yes',
    },
    {
      id: 'con-3',
      contractId: 'CON-2025-7632',
      status: 'Active',
      type: 'Amendment',
      value: '$35,500.00',
      effectiveDate: 'Mar 15, 2025',
      endDate: 'Mar 14, 2026',
      term: '12 months',
      autoRenew: 'No',
    },
    {
      id: 'con-4',
      contractId: 'CON-2025-6421',
      status: 'Expired',
      type: 'MSA',
      value: '$192,000.00',
      effectiveDate: 'Jan 1, 2025',
      endDate: 'Dec 31, 2025',
      term: '12 months',
      autoRenew: 'No',
    },
    {
      id: 'con-5',
      contractId: 'CON-2024-5890',
      status: 'Expired',
      type: 'MSA',
      value: '$168,000.00',
      effectiveDate: 'Nov 1, 2024',
      endDate: 'Oct 31, 2025',
      term: '12 months',
      autoRenew: 'Yes',
    },
    {
      id: 'con-6',
      contractId: 'CON-2024-4723',
      status: 'Expired',
      type: 'SOW',
      value: '$144,000.00',
      effectiveDate: 'Aug 15, 2024',
      endDate: 'Aug 14, 2025',
      term: '12 months',
      autoRenew: 'No',
    },
  ] as ContractListItem[],
}

export const CONTRACT_STATUS_STYLES: Record<ContractStatus, { bg: string; text: string }> = {
  'Pending Approval': { bg: 'bg-amber-50', text: 'text-amber-700' },
  Active: { bg: 'bg-green-50', text: 'text-green-700' },
  Expired: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
  Draft: { bg: 'bg-neutral-100', text: 'text-brand-navy' },
  Cancelled: { bg: 'bg-neutral-100', text: 'text-brand-fog' },
}

export type ContractListData = typeof contractListData
