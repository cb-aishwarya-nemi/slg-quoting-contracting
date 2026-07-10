import { useUseCase } from '@/context/UseCaseContext'
import { type SalesOrder } from '@/data/salesOrderMock'
import { SalesOrderDetailsV1 } from './SalesOrderDetailsV1'
import { SalesOrderDetailsV2 } from './SalesOrderDetailsV2'

export interface SalesOrderDetailsProps {
  order: SalesOrder
  orders: SalesOrder[]
  activeOrderId: string
  onSelectOrder: (id: string) => void
}

export function SalesOrderDetails(props: SalesOrderDetailsProps) {
  const { activePage, activeVariant, getPage } = useUseCase()
  const page = getPage('sales-order-details')
  const variant =
    activePage === 'sales-order-details' &&
    activeVariant &&
    page?.variants.some((v) => v.id === activeVariant)
      ? activeVariant
      : (page?.defaultVariant ?? 'v1')

  if (variant === 'v2') {
    return <SalesOrderDetailsV2 {...props} />
  }

  return <SalesOrderDetailsV1 {...props} />
}

export default SalesOrderDetails
