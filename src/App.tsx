import { AppLayout } from './components/layout'
import { WorkbenchPage, Customer360Page, InvoiceDetailsPage, AllInvoicesPage } from './pages'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { UseCaseProvider } from './context/UseCaseContext'
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

  return <WorkbenchPage />
}

function App() {
  return (
    <UseCaseProvider>
      <NavigationProvider>
        <AppLayout>
          <PageRouter />
        </AppLayout>
        {/* Use Case Switcher - always visible, highest z-index */}
        <UseCaseSwitcher />
      </NavigationProvider>
    </UseCaseProvider>
  )
}

export default App
