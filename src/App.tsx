import { AppLayout } from './components/layout'
import { WorkbenchPage, Customer360Page, InvoiceDetailsPage, AllInvoicesPage, AllContractsPage } from './pages'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { UseCaseProvider } from './context/UseCaseContext'
import { NotificationProvider } from './context/NotificationContext'
import { UseCaseSwitcher } from './components/ui/UseCaseSwitcher'

function PageRouter() {
  const { view } = useNavigation()

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

function App() {
  return (
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
  )
}

export default App
