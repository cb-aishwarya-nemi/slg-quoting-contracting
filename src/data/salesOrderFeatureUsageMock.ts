export interface BillingCycleUsage {
  cycle: number
  yearIndex: number
  /** Consumption shown per billing cycle. */
  usage: number
  /** Quota burn-down per cycle for the stepped area; defaults to usage. */
  poolDecrement?: number
}

export interface SalesOrderFeatureUsage {
  id: string
  label: string
  /** Unit shown beside values in the chart hover tooltip. */
  valueUnit: string
  capacity: number
  limitLine: number
  yAxisMax: number
  yAxisStep: number
  /** ISO date for the first billing cycle (e.g. 2026-05-01). */
  contractStartDate: string
  cycles: BillingCycleUsage[]
}

const PIONEER_CONTRACT_START = '2026-05-01'

const PIONEER_FEATURE_USAGE: SalesOrderFeatureUsage[] = [
  {
    id: 'api-calls',
    label: 'API calls / month',
    valueUnit: 'API calls',
    capacity: 12_000_000,
    limitLine: 12_000_000,
    yAxisMax: 12_500_000,
    yAxisStep: 2_500_000,
    contractStartDate: PIONEER_CONTRACT_START,
    cycles: [
      { cycle: 1, yearIndex: 0, usage: 2_300_000, poolDecrement: 1_077_778 },
      { cycle: 2, yearIndex: 0, usage: 2_320_000, poolDecrement: 1_077_778 },
      { cycle: 3, yearIndex: 0, usage: 2_280_000, poolDecrement: 1_077_778 },
      { cycle: 4, yearIndex: 0, usage: 2_310_000, poolDecrement: 1_077_778 },
      { cycle: 5, yearIndex: 0, usage: 2_290_000, poolDecrement: 1_077_778 },
      { cycle: 6, yearIndex: 0, usage: 2_300_000, poolDecrement: 1_077_778 },
      { cycle: 7, yearIndex: 0, usage: 2_280_000, poolDecrement: 1_077_778 },
      { cycle: 8, yearIndex: 0, usage: 2_310_000, poolDecrement: 1_077_778 },
      { cycle: 9, yearIndex: 0, usage: 2_290_000, poolDecrement: 1_077_776 },
      { cycle: 10, yearIndex: 0, usage: 2_300_000, poolDecrement: 2_300_000 },
      { cycle: 11, yearIndex: 0, usage: 2_350_000, poolDecrement: 0 },
      { cycle: 12, yearIndex: 0, usage: 2_600_000, poolDecrement: 0 },
    ],
  },
  {
    id: 'image-creation',
    label: 'Image creation',
    valueUnit: 'images',
    capacity: 2_500,
    limitLine: 2_500,
    yAxisMax: 3_000,
    yAxisStep: 500,
    contractStartDate: PIONEER_CONTRACT_START,
    cycles: [
      { cycle: 1, yearIndex: 0, usage: 420, poolDecrement: 36 },
      { cycle: 2, yearIndex: 0, usage: 580, poolDecrement: 36 },
      { cycle: 3, yearIndex: 0, usage: 710, poolDecrement: 36 },
      { cycle: 4, yearIndex: 0, usage: 890, poolDecrement: 36 },
      { cycle: 5, yearIndex: 0, usage: 1_050, poolDecrement: 36 },
      { cycle: 6, yearIndex: 0, usage: 1_280, poolDecrement: 36 },
      { cycle: 7, yearIndex: 0, usage: 1_620, poolDecrement: 36 },
      { cycle: 8, yearIndex: 0, usage: 1_840, poolDecrement: 36 },
      { cycle: 9, yearIndex: 0, usage: 2_050, poolDecrement: 32 },
      { cycle: 10, yearIndex: 0, usage: 2_180, poolDecrement: 2_180 },
      { cycle: 11, yearIndex: 0, usage: 2_420, poolDecrement: 0 },
      { cycle: 12, yearIndex: 0, usage: 2_650, poolDecrement: 0 },
    ],
  },
]

export function getSalesOrderFeatureUsage(orderId: string): SalesOrderFeatureUsage[] | null {
  if (orderId === 'so-pioneer-0153') return PIONEER_FEATURE_USAGE
  return null
}

export interface UsageLimitMetric {
  id: string
  label: string
  used: number
  allocated: number
  aiInsight?: string
}

export function getSalesOrderUsageLimits(orderId: string): UsageLimitMetric[] | null {
  if (orderId === 'so-pioneer-0153') {
    return [
      {
        id: 'seats',
        label: 'Seats',
        used: 45,
        allocated: 50,
        aiInsight:
          'Up from 38 → 45 seats this quarter. At this rate, the cap is reached ~6 weeks before renewal — before the customer has a chance to negotiate.',
      },
      {
        id: 'sandboxes',
        label: 'Sandboxes',
        used: 2,
        allocated: 2,
        aiInsight:
          'Provisioned but no activity in 45 days. Customers who don\'t use their sandbox environment in the first 60 days are significantly more likely to churn at renewal.',
      },
    ]
  }
  return null
}

export function formatFeatureUsageAxisValue(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatBillingCyclePeriod(
  cycle: number,
  yearIndex: number,
  contractStartDate?: string
): string {
  const base = `Month ${cycle}, Year ${yearIndex + 1}`
  if (!contractStartDate) return base

  const [year, month] = contractStartDate.split('-').map(Number)
  const monthOffset = yearIndex * 12 + (cycle - 1)
  const date = new Date(year, month - 1 + monthOffset, 1)
  const calendar = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return `${base} · ${calendar}`
}

/** Remaining quota at the start of each billing cycle (resets each year). */
export function getRemainingAtCycleStart(
  feature: SalesOrderFeatureUsage,
  cycleIndex: number
): number {
  const cycle = feature.cycles[cycleIndex]
  const yearCycles = feature.cycles.filter((c) => c.yearIndex === cycle.yearIndex)
  const indexInYear = yearCycles.findIndex(
    (c) => c.cycle === cycle.cycle && c.yearIndex === cycle.yearIndex
  )
  const usedBefore = yearCycles
    .slice(0, indexInYear)
    .reduce((sum, c) => sum + (c.poolDecrement ?? c.usage), 0)
  return Math.max(0, feature.capacity - usedBefore)
}

/** Consumption covered by remaining quota vs overage for a billing cycle. */
export function getCycleConsumptionSplit(
  feature: SalesOrderFeatureUsage,
  cycleIndex: number
): { withinQuota: number; overage: number } {
  const remainingStart = getRemainingAtCycleStart(feature, cycleIndex)
  const usage = feature.cycles[cycleIndex].usage

  if (remainingStart <= 0) {
    return { withinQuota: 0, overage: usage }
  }

  return { withinQuota: usage, overage: 0 }
}
