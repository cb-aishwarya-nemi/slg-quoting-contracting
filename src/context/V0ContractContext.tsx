import { createContext, useContext, useState, type ReactNode } from 'react'

interface V0ContractContextValue {
  activeContractId: number | null
  setActiveContractId: (id: number | null) => void
}

const V0ContractContext = createContext<V0ContractContextValue | null>(null)

export function V0ContractProvider({ children }: { children: ReactNode }) {
  const [activeContractId, setActiveContractId] = useState<number | null>(null)

  return (
    <V0ContractContext.Provider value={{ activeContractId, setActiveContractId }}>
      {children}
    </V0ContractContext.Provider>
  )
}

export function useV0Contract() {
  const context = useContext(V0ContractContext)
  if (!context) {
    throw new Error('useV0Contract must be used within a V0ContractProvider')
  }
  return context
}
