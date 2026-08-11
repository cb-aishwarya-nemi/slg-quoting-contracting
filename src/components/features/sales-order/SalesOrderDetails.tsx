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
  // Sales Order Details is no longer in the (now trimmed) use case registry,
  // so `page` is always undefined here — default to v2 (the current design)
  // rather than the registry's old default so this doesn't visibly regress.
  const variant =
    activePage === 'sales-order-details' &&
    activeVariant &&
    page?.variants.some((v) => v.id === activeVariant)
      ? activeVariant
      : (page?.defaultVariant ?? 'v2')

  if (variant === 'v2') {
    return <SalesOrderDetailsV2 {...props} />
  }

  return <SalesOrderDetailsV1 {...props} />
}

export default SalesOrderDetails
