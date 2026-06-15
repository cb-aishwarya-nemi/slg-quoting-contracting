import { type ReactNode, useEffect, useRef } from 'react'
import { LeftNav } from './LeftNav'
import { TopNav } from './TopNav'
import { FileDropProvider, useFileDrop } from '../../context/FileDropContext'
import { FileDropOverlay } from '../ui/FileDropOverlay'

interface AppLayoutProps {
  children: ReactNode
}

function AppLayoutInner({ children }: AppLayoutProps) {
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
    <div className="h-screen overflow-hidden bg-white">
      <LeftNav />
      <TopNav />
      
      {/* Main content area - offset by nav dimensions */}
      <main className="ml-12 mt-10 h-[calc(100vh-40px)] bg-white">
        {children}
      </main>

      {/* File drop overlay */}
      <FileDropOverlay />
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
