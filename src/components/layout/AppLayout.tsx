import { type ReactNode, useEffect, useRef } from 'react'
import { LeftNav } from './LeftNav'
import { MinimalLeftNav } from './MinimalLeftNav'
import { TopNav } from './TopNav'
import { TopNavV0 } from './TopNavV0'
import { FileDropProvider, useFileDrop } from '../../context/FileDropContext'
import { useVersion } from '../../context/VersionContext'
import { V0ContractProvider, useV0Contract } from '../../context/V0ContractContext'
import { FileDropOverlay } from '../ui/FileDropOverlay'

interface AppLayoutProps {
  children: ReactNode
}

interface V0LayoutProps {
  children: ReactNode
}

function V0LayoutInner({ children }: V0LayoutProps) {
  const { activeContractId, setActiveContractId } = useV0Contract()
  
  const handleNewContract = () => {
    setActiveContractId(null)
  }
  
  const handleSelectContract = (contractId: number) => {
    setActiveContractId(contractId)
  }
  
  return (
    <div className="v0-layout h-full bg-theme-surface">
      <MinimalLeftNav
        activeContractId={activeContractId}
        onNewContract={handleNewContract}
        onSelectContract={handleSelectContract}
      />
      <TopNavV0 />
      <main className="ml-12 mt-10 h-[calc(100vh-40px)] bg-theme-surface">
        {children}
      </main>
    </div>
  )
}

function V0Layout({ children }: V0LayoutProps) {
  return (
    <V0ContractProvider>
      <V0LayoutInner>{children}</V0LayoutInner>
    </V0ContractProvider>
  )
}

function V1Layout({ children }: { children: ReactNode }) {
  const { setIsDragging } = useFileDrop()
  const dragCounterRef = useRef(0)

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      dragCounterRef.current++
      
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      dragCounterRef.current--
      
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [setIsDragging])
  
  return (
    <>
      <LeftNav />
      <TopNav />
      <main className="ml-12 mt-10 h-[calc(100vh-40px)] bg-white">
        {children}
      </main>
      {/* File drop overlay - only for V1.0 */}
      <FileDropOverlay />
    </>
  )
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { isV0 } = useVersion()

  return (
    <div className="h-screen overflow-hidden bg-white">
      {isV0 ? (
        <V0Layout>{children}</V0Layout>
      ) : (
        <V1Layout>{children}</V1Layout>
      )}
    </div>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <FileDropProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </FileDropProvider>
  )
}
