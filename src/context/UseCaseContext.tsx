import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

/**
 * Use Case Variant Definition
 * Each variant represents a different state/scenario of a page or modal
 */
export interface UseCaseVariant {
  id: string
  label: string
  description?: string
}

/**
 * Page/Modal Definition
 * Defines a page or modal and its available use case variants
 */
export interface UseCasePage {
  id: string
  label: string
  variants: UseCaseVariant[]
  defaultVariant: string
}

/**
 * Registry of sales-order stage variants for this branch.
 */
export const USE_CASE_REGISTRY: UseCasePage[] = [
  {
    id: 'sales-order-details',
    label: 'Sales Order Details',
    defaultVariant: 'just-created',
    variants: [
      {
        id: 'just-created',
        label: 'Just created',
        description: 'Sales order right after it was created from the contract',
      },
      {
        id: 'invoice-overdue',
        label: 'Invoice overdue',
        description: 'Sales order with an overdue invoice that needs attention',
      },
      {
        id: 'renewal-approaching',
        label: 'Renewal approaching',
        description: 'Sales order nearing renewal with upcoming decisions',
      },
    ],
  },
]

/**
 * URL Query Parameter Names
 */
const URL_PARAMS = {
  PAGE: 'page',
  VARIANT: 'variant',
} as const

/**
 * Context Value Interface
 */
interface UseCaseContextValue {
  // Current state
  activePage: string | null
  activeVariant: string | null
  
  // Registry access
  registry: UseCasePage[]
  getPage: (pageId: string) => UseCasePage | undefined
  getVariantsForPage: (pageId: string) => UseCaseVariant[]
  
  // Actions
  setActivePage: (pageId: string | null) => void
  setVariant: (variantId: string) => void
  
  // URL helpers
  getShareableUrl: () => string
}

const UseCaseContext = createContext<UseCaseContextValue | null>(null)

/**
 * Parse URL query parameters to get initial state
 */
function getInitialStateFromUrl(): { page: string | null; variant: string | null } {
  if (typeof window === 'undefined') {
    return { page: null, variant: null }
  }
  
  const params = new URLSearchParams(window.location.search)
  const page = params.get(URL_PARAMS.PAGE)
  const variant = params.get(URL_PARAMS.VARIANT)
  
  return { page, variant }
}

/**
 * Update URL query parameters without page reload
 */
function updateUrl(page: string | null, variant: string | null) {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  
  if (page) {
    url.searchParams.set(URL_PARAMS.PAGE, page)
  } else {
    url.searchParams.delete(URL_PARAMS.PAGE)
  }
  
  if (variant) {
    url.searchParams.set(URL_PARAMS.VARIANT, variant)
  } else {
    url.searchParams.delete(URL_PARAMS.VARIANT)
  }
  
  window.history.replaceState({}, '', url.toString())
}

/**
 * UseCaseProvider
 * Provides use case switching functionality throughout the app
 */
export function UseCaseProvider({ children }: { children: ReactNode }) {
  // Initialize from URL params
  const initialState = getInitialStateFromUrl()
  
  const [activePage, setActivePageState] = useState<string | null>(initialState.page)
  const [activeVariant, setActiveVariantState] = useState<string | null>(initialState.variant)
  
  // Get page definition from registry
  const getPage = useCallback((pageId: string) => {
    return USE_CASE_REGISTRY.find(p => p.id === pageId)
  }, [])
  
  // Get variants for a specific page
  const getVariantsForPage = useCallback((pageId: string) => {
    const page = getPage(pageId)
    return page?.variants ?? []
  }, [getPage])
  
  // Set active page (called when a page/modal becomes active)
  const setActivePage = useCallback((pageId: string | null) => {
    setActivePageState(pageId)
    
    if (pageId) {
      const page = USE_CASE_REGISTRY.find(p => p.id === pageId)
      if (page) {
        // If no variant is set or current variant doesn't exist for this page,
        // use the default variant for this page
        setActiveVariantState(prevVariant => {
          const validVariants = page.variants.map(v => v.id)
          if (prevVariant && validVariants.includes(prevVariant)) {
            return prevVariant
          }
          return page.defaultVariant
        })
      }
    }
  }, [])
  
  // Set variant for current page
  const setVariant = useCallback((variantId: string) => {
    setActiveVariantState(variantId)
  }, [])
  
  // Sync state changes to URL
  useEffect(() => {
    updateUrl(activePage, activeVariant)
  }, [activePage, activeVariant])
  
  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const url = new URL(window.location.href)
    if (activePage) {
      url.searchParams.set(URL_PARAMS.PAGE, activePage)
    }
    if (activeVariant) {
      url.searchParams.set(URL_PARAMS.VARIANT, activeVariant)
    }
    return url.toString()
  }, [activePage, activeVariant])
  
  const value: UseCaseContextValue = {
    activePage,
    activeVariant,
    registry: USE_CASE_REGISTRY,
    getPage,
    getVariantsForPage,
    setActivePage,
    setVariant,
    getShareableUrl,
  }
  
  return (
    <UseCaseContext.Provider value={value}>
      {children}
    </UseCaseContext.Provider>
  )
}

/**
 * Hook to access use case context
 */
export function useUseCase() {
  const context = useContext(UseCaseContext)
  if (!context) {
    throw new Error('useUseCase must be used within a UseCaseProvider')
  }
  return context
}

/**
 * Hook for pages/modals to register themselves and get their current variant
 * This should be called at the top of each page/modal component
 */
export function usePageUseCase(pageId: string) {
  const { activePage, activeVariant, setActivePage, getPage, setVariant } = useUseCase()
  
  // Register this page when component mounts
  useEffect(() => {
    setActivePage(pageId)
    
    return () => {
      // Only clear if this page is still active when unmounting
      // This prevents clearing when navigating between pages
    }
  }, [pageId, setActivePage])
  
  const page = getPage(pageId)
  
  // Determine current variant, falling back to default
  const currentVariant = (() => {
    if (activePage === pageId && activeVariant) {
      // Verify the variant exists for this page
      const variantExists = page?.variants.some(v => v.id === activeVariant)
      if (variantExists) {
        return activeVariant
      }
    }
    return page?.defaultVariant ?? null
  })()
  
  return {
    currentVariant,
    variants: page?.variants ?? [],
    setVariant,
    isActive: activePage === pageId,
  }
}
