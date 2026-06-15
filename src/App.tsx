import { AppLayout } from './components/layout'
import { WorkbenchPage, Customer360Page } from './pages'
import { NavigationProvider, useNavigation } from './context/NavigationContext'

function PageRouter() {
  const { view } = useNavigation()

  if (view.name === 'customer360') {
    return <Customer360Page />
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
