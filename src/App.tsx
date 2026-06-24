import { useState } from 'react'
import { AppLayout } from './components/layout'
import { WorkbenchPage, CustomersPage, Customer360Page, InvoiceDetailsPage, AllInvoicesPage, AllContractsPage, ContractIngestionPage } from './pages'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { UseCaseProvider } from './context/UseCaseContext'
import { NotificationProvider } from './context/NotificationContext'
import { VersionProvider, useVersion } from './context/VersionContext'
import { ThemeProvider } from './context/ThemeContext'
import { UseCaseSwitcher } from './components/ui/UseCaseSwitcher'

function V1PageRouter() {
  const { view } = useNavigation()

  if (view.name === 'customers') {
    return <CustomersPage />
  }

  if (view.name === 'customer360') {
    return <Customer360Page />
  }

  if (view.name === 'invoiceDetails') {
    return <InvoiceDetailsPage />
  }

  if (view.name === 'allInvoices') {
    return <AllInvoicesPage />
  }

  if (view.name === 'allContracts') {
    return <AllContractsPage />
  }

  return <WorkbenchPage />
}

function V0PageRouter() {
  const [activeContractId, setActiveContractId] = useState<number | null>(null)
  
  const handleContractProcessed = (contractId: number) => {
    setActiveContractId(contractId)
  }
  
  return (
    <ContractIngestionPage 
      activeContractId={activeContractId}
      onContractProcessed={handleContractProcessed}
    />
  )
}

function PageRouter() {
  const { isV0 } = useVersion()
  
  if (isV0) {
    return <V0PageRouter />
  }
  
  return <V1PageRouter />
}

function App() {
  return (
    <VersionProvider>
      <ThemeProvider>
        <UseCaseProvider>
          <NotificationProvider>
            <NavigationProvider>
              <AppLayout>
                <PageRouter />
              </AppLayout>
              {/* Use Case Switcher - always visible, highest z-index */}
              <UseCaseSwitcher />
            </NavigationProvider>
          </NotificationProvider>
        </UseCaseProvider>
      </ThemeProvider>
    </VersionProvider>
  )
}

export default App
