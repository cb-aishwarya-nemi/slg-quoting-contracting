import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type View =
  | { name: 'workbench' }
  | { name: 'customer360'; customerId: string }
  | { name: 'invoiceDetails'; invoiceId: string }
  | { name: 'allInvoices'; customerId: string }

interface NavigationContextValue {
  view: View
  goToWorkbench: () => void
  goToCustomer360: (customerId: string) => void
  goToInvoiceDetails: (invoiceId: string) => void
  goToAllInvoices: (customerId: string) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ name: 'workbench' })

  const goToWorkbench = useCallback(() => {
    setView({ name: 'workbench' })
  }, [])

  const goToCustomer360 = useCallback((customerId: string) => {
    setView({ name: 'customer360', customerId })
  }, [])

  const goToInvoiceDetails = useCallback((invoiceId: string) => {
    setView({ name: 'invoiceDetails', invoiceId })
  }, [])

  const goToAllInvoices = useCallback((customerId: string) => {
    setView({ name: 'allInvoices', customerId })
  }, [])

  return (
    <NavigationContext.Provider value={{ view, goToWorkbench, goToCustomer360, goToInvoiceDetails, goToAllInvoices }}>
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
