import { AppLayout } from './components/layout'
import { WorkbenchPage, Customer360Page, InvoiceDetailsPage, AllInvoicesPage } from './pages'
import { NavigationProvider, useNavigation } from './context/NavigationContext'

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
    <NavigationProvider>
      <AppLayout>
        <PageRouter />
      </AppLayout>
    </NavigationProvider>
  )
}

export default App
