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
  /** Optional AI headline shown above the chart for this feature. */
  aiInsightTitle?: string
  /** Optional AI note shown below the title (and above the chart). */
  aiInsight?: string
}

/** `healthy` = All good; `attention` = UBB chart 2 (usage risk). */
export type FeatureUsageProfile = 'healthy' | 'attention'

/** Flat-ish series kept under monthly commit and inside the green quota band. */
function steadyCycles(
  values: number[],
  poolDecrement: number
): BillingCycleUsage[] {
  return values.map((usage, index) => ({
    cycle: index + 1,
    yearIndex: 0,
    usage,
    poolDecrement,
  }))
}

/** Period 1 · May–Dec 2025 — early contract, lighter usage, 8 billing months. */
const PIONEER_FEATURE_USAGE_HEALTHY_P1: SalesOrderFeatureUsage[] = [
  {
    id: 'api-calls',
    label: 'API calls / month',
    valueUnit: 'API calls',
    capacity: 12_000_000,
    limitLine: 12_000_000,
    yAxisMax: 12_500_000,
    yAxisStep: 2_500_000,
    contractStartDate: '2025-05-01',
    aiInsight:
      'In Period 1, API usage ramped from ~1.2M to ~1.7M calls/month after go-live — well under commit with plenty of headroom.',
    cycles: steadyCycles(
      [1_180_000, 1_260_000, 1_340_000, 1_420_000, 1_510_000, 1_580_000, 1_650_000, 1_720_000],
      1_200_000
    ),
  },
  {
    id: 'image-creation',
    label: 'Image creation',
    valueUnit: 'images',
    capacity: 2_500,
    limitLine: 2_500,
    yAxisMax: 3_000,
    yAxisStep: 500,
    contractStartDate: '2025-05-01',
    aiInsight:
      'Image creation started light in Period 1 (~900–1,200 images/month) as teams onboarded — comfortably under the 2,500 commit.',
    cycles: steadyCycles([920, 980, 1_040, 1_090, 1_140, 1_180, 1_210, 1_250], 80),
  },
]

/** Period 2 · Jan–Dec 2026 — current year, steady healthy usage (default). */
const PIONEER_FEATURE_USAGE_HEALTHY_P2: SalesOrderFeatureUsage[] = [
  {
    id: 'api-calls',
    label: 'API calls / month',
    valueUnit: 'API calls',
    capacity: 12_000_000,
    limitLine: 12_000_000,
    yAxisMax: 12_500_000,
    yAxisStep: 2_500_000,
    contractStartDate: '2026-01-01',
    aiInsight:
      'API usage is tracking steadily around 2.0M calls/month — well inside the annual commit with no projected overage through year-end.',
    cycles: steadyCycles(
      [
        1_980_000, 2_040_000, 1_960_000, 2_020_000, 1_990_000, 2_010_000, 2_000_000, 2_030_000,
        1_970_000, 2_020_000, 2_000_000, 2_050_000,
      ],
      800_000
    ),
  },
  {
    id: 'image-creation',
    label: 'Image creation',
    valueUnit: 'images',
    capacity: 2_500,
    limitLine: 2_500,
    yAxisMax: 3_000,
    yAxisStep: 500,
    contractStartDate: '2026-01-01',
    aiInsight:
      'Image creation is stable around 1,400–1,500 images/month — comfortably under the 2,500 commit with headroom remaining through the year.',
    cycles: steadyCycles(
      [1_380, 1_420, 1_400, 1_450, 1_410, 1_430, 1_420, 1_460, 1_400, 1_440, 1_430, 1_470],
      60
    ),
  },
]

/** Period 3 · Jan–Dec 2027 — future period; no consumption yet. */
const PIONEER_FEATURE_USAGE_HEALTHY_P3: SalesOrderFeatureUsage[] = [
  {
    id: 'api-calls',
    label: 'API calls / month',
    valueUnit: 'API calls',
    capacity: 12_000_000,
    limitLine: 12_000_000,
    yAxisMax: 12_500_000,
    yAxisStep: 2_500_000,
    contractStartDate: '2027-01-01',
    aiInsight:
      'Period 3 has not started yet. Usage tracking for this year begins January 2027 — commit and entitlements carry forward from the current term.',
    cycles: steadyCycles(Array.from({ length: 12 }, () => 0), 0),
  },
  {
    id: 'image-creation',
    label: 'Image creation',
    valueUnit: 'images',
    capacity: 2_500,
    limitLine: 2_500,
    yAxisMax: 3_000,
    yAxisStep: 500,
    contractStartDate: '2027-01-01',
    aiInsight:
      'No image creation usage in Period 3 yet — this billing year opens in January 2027.',
    cycles: steadyCycles(Array.from({ length: 12 }, () => 0), 0),
  },
]

const PIONEER_FEATURE_USAGE_HEALTHY_BY_PERIOD: Record<number, SalesOrderFeatureUsage[]> = {
  1: PIONEER_FEATURE_USAGE_HEALTHY_P1,
  2: PIONEER_FEATURE_USAGE_HEALTHY_P2,
  3: PIONEER_FEATURE_USAGE_HEALTHY_P3,
}

const PIONEER_FEATURE_USAGE_HEALTHY = PIONEER_FEATURE_USAGE_HEALTHY_P2

/** Rising usage that burns/exceeds quota — used by UBB chart 2. */
const PIONEER_CONTRACT_START = '2026-05-01'

const PIONEER_FEATURE_USAGE_ATTENTION: SalesOrderFeatureUsage[] = [
  {
    id: 'api-calls',
    label: 'API calls / month',
    valueUnit: 'API calls',
    capacity: 12_000_000,
    limitLine: 12_000_000,
    yAxisMax: 12_500_000,
    yAxisStep: 2_500_000,
    contractStartDate: PIONEER_CONTRACT_START,
    aiInsight:
      'At the current rate of 23K API calls/month, Pioneer Systems will exceed their commit in October — 2 months before contract renewal. Projected annual usage: 276K calls, generating $4,820.00 in overage charges.',
    cycles: [
      { cycle: 1, yearIndex: 0, usage: 2_300_000, poolDecrement: 1_000_000 },
      { cycle: 2, yearIndex: 0, usage: 2_320_000, poolDecrement: 1_000_000 },
      { cycle: 3, yearIndex: 0, usage: 2_280_000, poolDecrement: 1_000_000 },
      { cycle: 4, yearIndex: 0, usage: 2_310_000, poolDecrement: 1_000_000 },
      { cycle: 5, yearIndex: 0, usage: 2_290_000, poolDecrement: 1_000_000 },
      { cycle: 6, yearIndex: 0, usage: 2_300_000, poolDecrement: 1_000_000 },
      { cycle: 7, yearIndex: 0, usage: 2_280_000, poolDecrement: 1_000_000 },
      { cycle: 8, yearIndex: 0, usage: 2_310_000, poolDecrement: 1_000_000 },
      { cycle: 9, yearIndex: 0, usage: 2_290_000, poolDecrement: 1_000_000 },
      { cycle: 10, yearIndex: 0, usage: 2_300_000, poolDecrement: 1_000_000 },
      { cycle: 11, yearIndex: 0, usage: 2_350_000, poolDecrement: 1_000_000 },
      { cycle: 12, yearIndex: 0, usage: 2_600_000, poolDecrement: 1_000_000 },
    ],
  },
  {
    id: 'image-creation',
    label: 'Image creation',
    valueUnit: 'images',
    capacity: 2_500,
    limitLine: 2_500,
    yAxisMax: 5_000,
    yAxisStep: 1_000,
    contractStartDate: PIONEER_CONTRACT_START,
    aiInsightTitle:
      '91% of image creation commit reached in 12 days (20% of cycle time)',
    aiInsight:
      'Image usage has climbed steadily over the past three billing cycles — from 1,420 to 1,890 to 2,273 images. At the current rate of ~85 images per day, projected end-of-month usage is 3,035 images — about 535 past the 2,500 commit, generating roughly $268.00 in overage charges. This pattern suggests sustained growth, not a one-off burst.',
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
      { cycle: 10, yearIndex: 0, usage: 2_180, poolDecrement: 400 },
      { cycle: 11, yearIndex: 0, usage: 2_650, poolDecrement: 1_350 },
      { cycle: 12, yearIndex: 0, usage: 3_350, poolDecrement: 426 },
    ],
  },
]

export function getSalesOrderFeatureUsage(
  orderId: string,
  profile: FeatureUsageProfile = 'healthy',
  /** 1-based contract period for All good period switcher; defaults to current (2). */
  periodIndex = 2
): SalesOrderFeatureUsage[] | null {
  if (orderId !== 'so-pioneer-0153') return null
  if (profile === 'attention') return PIONEER_FEATURE_USAGE_ATTENTION
  return (
    PIONEER_FEATURE_USAGE_HEALTHY_BY_PERIOD[periodIndex] ?? PIONEER_FEATURE_USAGE_HEALTHY
  )
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
      },
      {
        id: 'sandboxes',
        label: 'Sandboxes',
        used: 2,
        allocated: 2,
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

  if (usage > remainingStart) {
    return { withinQuota: remainingStart, overage: usage - remainingStart }
  }

  return { withinQuota: usage, overage: 0 }
}
