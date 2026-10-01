import {
  Bell,
  FolderOpen,
  Gear,
  Globe,
  House,
  Package,
  Receipt,
  Sparkle,
  Square,
  UserCircle,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useNavigation } from '../../context/NavigationContext'
import cbLogo from '../../assets/cb-logo-squircle.svg'

/** Measured from the 50×1024 reference rail. Glyph boxes are 22px; stack pitch is 42px. */
const ICON_SIZE = 22
const STACK_GAP = 20
const ACTIVE_BLUE = '#3748DD'

interface NavItem {
  id: string
  icon: Icon
  label: string
  fillWhenActive?: boolean
  onClick?: () => void
}

function NavTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      {label}
    </span>
  )
}

export function LeftNav() {
  const { view, goToWorkbench, goToCustomers, goToSalesOrders } = useNavigation()

  const mainItems: NavItem[] = [
    { id: 'workbench', icon: House, label: 'Workbench', fillWhenActive: true, onClick: goToWorkbench },
    { id: 'records', icon: FolderOpen, label: 'Records', onClick: goToCustomers },
    { id: 'revenue', icon: Square, label: 'Revenue accounting' },
    { id: 'catalog', icon: Package, label: 'Product catalog', onClick: goToSalesOrders },
    { id: 'logs', icon: Receipt, label: 'Logs' },
    { id: 'settings', icon: Gear, label: 'Settings' },
  ]

  const bottomItems: NavItem[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'account', icon: UserCircle, label: 'Account' },
    { id: 'apex', icon: Sparkle, label: 'Apex' },
  ]

  const isItemActive = (item: NavItem) => {
    if (item.id === 'workbench') return view.name === 'workbench'
    if (item.id === 'records') return view.name === 'customers'
    if (item.id === 'catalog') return view.name === 'salesOrders'
    return false
  }

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const isActive = isItemActive(item)
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex cursor-pointer items-center justify-center text-brand-navy',
          isActive && 'text-[#3748DD]'
        )}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      >
        <Icon
          size={ICON_SIZE}
          weight={isActive && item.fillWhenActive ? 'fill' : 'regular'}
          color={isActive ? ACTIVE_BLUE : 'currentColor'}
          className="shrink-0"
        />
        <NavTooltip label={item.label} />
      </button>
    )
  }

  return (
    <div className="fixed left-0 top-0 z-50 h-screen w-12">
      <nav className="flex h-screen w-12 flex-col overflow-visible bg-white">
        <div className="flex shrink-0 items-center justify-center pt-[18px]">
          <img src={cbLogo} alt="Chargebee" className="h-8 w-8 shrink-0 object-contain" />
        </div>

        <button
          type="button"
          aria-label="Site/Entity"
          className="group relative mt-[31px] flex shrink-0 cursor-pointer items-center justify-center self-center text-brand-navy"
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        >
          <Globe size={ICON_SIZE} weight="regular" />
          <NavTooltip label="Site/Entity" />
        </button>

        <div className="mt-[56px] flex flex-col items-center" style={{ gap: STACK_GAP }}>
          {mainItems.map((item) => renderItem(item))}
        </div>

        <div className="mb-[17px] mt-auto flex flex-col items-center" style={{ gap: STACK_GAP }}>
          {bottomItems.map((item) => renderItem(item))}
        </div>
      </nav>
    </div>
  )
}
