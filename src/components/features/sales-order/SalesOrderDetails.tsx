import { useUseCase } from '@/context/UseCaseContext'
import { type SalesOrder } from '@/data/salesOrderMock'
import { SalesOrderDetailsV1 } from './SalesOrderDetailsV1'
import { SalesOrderDetailsV2 } from './SalesOrderDetailsV2'

export type UbbChartVariant = 'ubb-chart-1' | 'ubb-chart-2'
export type SalesOrderScenario = 'non-ubb' | UbbChartVariant | 'all-good'

export interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

/** Map registry / legacy URLs onto the sales-order scenarios. */
export function resolveSalesOrderScenario(variantId: string | null | undefined): SalesOrderScenario {
  if (variantId === 'non-ubb') return 'non-ubb'
  if (variantId === 'all-good' || variantId === 'v2') return 'all-good'
  if (variantId === 'ubb-chart-2') return 'ubb-chart-2'
  // `ubb-chart-1`, legacy `ubb` / `v1`, and unknown → UBB chart 1
  return 'ubb-chart-1'
}

function isUbbChartScenario(scenario: SalesOrderScenario): scenario is UbbChartVariant {
  return scenario === 'ubb-chart-1' || scenario === 'ubb-chart-2'
}

export function SalesOrderDetails(props: SalesOrderDetailsProps) {
  const { activePage, activeVariant, getPage } = useUseCase()
  const page = getPage('sales-order-details')
  const variant =
    activePage === 'sales-order-details' &&
    activeVariant &&
    page?.variants.some((v) => v.id === activeVariant)
      ? activeVariant
      : (page?.defaultVariant ?? 'ubb-chart-1')

  const scenario = resolveSalesOrderScenario(variant)

  if (isUbbChartScenario(scenario)) {
    return <SalesOrderDetailsV1 {...props} chartVariant={scenario} />
  }

  return <SalesOrderDetailsV2 {...props} scenario={scenario} />
}

export default SalesOrderDetails
