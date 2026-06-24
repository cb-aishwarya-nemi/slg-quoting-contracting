import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

export type AppVersion = 'v0.1' | 'v1.0'

interface VersionContextValue {
  version: AppVersion
  setVersion: (version: AppVersion) => void
  isV0: boolean
  isV1: boolean
}

const VersionContext = createContext<VersionContextValue | null>(null)

const VERSION_STORAGE_KEY = 'apex-app-version'
const VERSION_URL_PARAM = 'version'

function getInitialVersion(): AppVersion {
  if (typeof window === 'undefined') return 'v1.0'
  
  // URL param takes precedence
  const params = new URLSearchParams(window.location.search)
  const urlVersion = params.get(VERSION_URL_PARAM)
  if (urlVersion === 'v0.1' || urlVersion === 'v1.0') {
    return urlVersion
  }
  
  // Fall back to localStorage
  const stored = localStorage.getItem(VERSION_STORAGE_KEY)
  if (stored === 'v0.1' || stored === 'v1.0') {
    return stored
  }
  
  // Default to V1.0 (full SLG prototype)
  return 'v1.0'
}

function updateVersionUrl(version: AppVersion) {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  url.searchParams.set(VERSION_URL_PARAM, version)
  window.history.replaceState({}, '', url.toString())
}

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<AppVersion>(getInitialVersion)
  
  const setVersion = useCallback((newVersion: AppVersion) => {
    setVersionState(newVersion)
    localStorage.setItem(VERSION_STORAGE_KEY, newVersion)
    updateVersionUrl(newVersion)
  }, [])
  
  // Sync to URL on mount
  useEffect(() => {
    updateVersionUrl(version)
  }, [])
  
  const value: VersionContextValue = {
    version,
    setVersion,
    isV0: version === 'v0.1',
    isV1: version === 'v1.0',
  }
  
  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  )
}

export function useVersion() {
  const context = useContext(VersionContext)
  if (!context) {
    throw new Error('useVersion must be used within a VersionProvider')
  }
  return context
}
