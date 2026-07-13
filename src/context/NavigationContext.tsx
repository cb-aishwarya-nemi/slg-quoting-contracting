import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type View =
  | { name: 'workbench' }
  | { name: 'customers' }
  | { name: 'salesOrders' }
  | { name: 'customer360'; customerId: string; tab?: string; salesOrderId?: string; returnTo?: 'customers' | 'salesOrders' }
  | { name: 'invoiceDetails'; invoiceId: string }
  | { name: 'allInvoices'; customerId: string }
  | { name: 'allContracts'; customerId: string }

interface NavigationContextValue {
  view: View
  goToWorkbench: () => void
  goToCustomers: () => void
  goToSalesOrders: () => void
  goToCustomer360: (
    customerId: string,
    options?: { tab?: string; salesOrderId?: string; returnTo?: 'customers' | 'salesOrders' }
  ) => void
  goToInvoiceDetails: (invoiceId: string) => void
  goToAllInvoices: (customerId: string) => void
  goToAllContracts: (customerId: string) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ name: 'workbench' })

  const goToWorkbench = useCallback(() => {
    setView({ name: 'workbench' })
  }, [])

  const goToCustomers = useCallback(() => {
    setView({ name: 'customers' })
  }, [])

  const goToSalesOrders = useCallback(() => {
    setView({ name: 'salesOrders' })
  }, [])

  const goToCustomer360 = useCallback(
    (customerId: string, options?: { tab?: string; salesOrderId?: string; returnTo?: 'customers' | 'salesOrders' }) => {
      setView({
        name: 'customer360',
        customerId,
        ...(options?.tab ? { tab: options.tab } : {}),
        ...(options?.salesOrderId ? { salesOrderId: options.salesOrderId } : {}),
        ...(options?.returnTo ? { returnTo: options.returnTo } : {}),
      })
    },
    []
  )

  const goToInvoiceDetails = useCallback((invoiceId: string) => {
    setView({ name: 'invoiceDetails', invoiceId })
  }, [])

  const goToAllInvoices = useCallback((customerId: string) => {
    setView({ name: 'allInvoices', customerId })
  }, [])

  const goToAllContracts = useCallback((customerId: string) => {
    setView({ name: 'allContracts', customerId })
  }, [])

  return (
    <NavigationContext.Provider value={{ view, goToWorkbench, goToCustomers, goToSalesOrders, goToCustomer360, goToInvoiceDetails, goToAllInvoices, goToAllContracts }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
