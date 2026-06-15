import { useState, useRef, useEffect } from 'react'
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PDF_FILES = [
  { id: '1', name: 'MSA_Pioneer_Systems_2026.pdf' },
  { id: '2', name: 'SOW_Implementation_Services.pdf' },
  { id: '3', name: 'Pricing_Addendum_Q2.pdf' },
]

function truncateFileName(name: string, maxLength: number = 15): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength) + '...'
}

export function ContractPreview() {
  const [selectedPdf, setSelectedPdf] = useState(PDF_FILES[0])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-brand-navy bg-neutral-50">
      {/* Control Bar */}
      <div className="flex shrink-0 items-center justify-between bg-brand-navy px-4 py-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-white/10"
          >
            <FileText size={16} className="text-white" />
            <span className="text-[13px] font-medium text-white">
              {truncateFileName(selectedPdf.name)}
            </span>
            <ChevronDown size={14} className="text-white/70" />
          </button>
          
          {showDropdown && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              {PDF_FILES.map((pdf) => (
                <button
                  key={pdf.id}
                  type="button"
                  onClick={() => {
                    setSelectedPdf(pdf)
                    setShowDropdown(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50',
                    selectedPdf.id === pdf.id ? 'bg-blue-50 text-blue-800' : 'text-brand-navy'
                  )}
                >
                  <FileText size={14} className={selectedPdf.id === pdf.id ? 'text-blue-700' : 'text-brand-fog'} />
                  <span className="truncate">{pdf.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12px] text-white/70">
              <span className="text-white">1</span> / 3
            </span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[12px] text-white/70">70%</span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ZoomIn size={14} />
            </button>
          </div>
          
          {/* Download */}
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      
      {/* Document Preview */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-[520px] rounded-lg bg-white p-8 shadow-sm">
          {/* Document Header */}
          <div className="mb-6 text-center">
            <h2 className="font-heading text-[18px] font-semibold text-brand-navy">
              MASTER SERVICE AGREEMENT
            </h2>
            <p className="mt-1 text-[11px] text-brand-fog">Contract #SAMPLES</p>
          </div>
          
          {/* Parties */}
          <div className="mb-6 flex gap-6">
            <div className="flex-1">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-brand-fog">Provider</p>
              <p className="text-[12px] font-medium text-brand-navy">Chargebee Inc.</p>
              <p className="text-[11px] text-brand-fog">340 S Lemon Ave #1111</p>
              <p className="text-[11px] text-brand-fog">Walnut, CA 91789</p>
            </div>
            <div className="flex-1">
              <div className="rounded-md border border-green-200 bg-green-50 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-green-700">Customer</p>
                <p className="text-[12px] font-medium text-brand-navy">Pioneer Systems Corp.</p>
                <p className="text-[11px] text-brand-fog">Pioneer Systems</p>
                <p className="mt-1 text-[11px] text-brand-fog">Contact: Alex Nguyen</p>
                <p className="text-[11px] text-brand-fog">alex.nguyen@pioneersystems.com</p>
              </div>
            </div>
          </div>
          
          {/* Contract Terms */}
          <div className="mb-5">
            <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">1. Contract Terms</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="text-[10px] text-brand-fog">Effective Date:</p>
                <p className="text-[11px] text-brand-navy">May 1, 2026</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-fog">End Date:</p>
                <p className="text-[11px] text-brand-navy">April 30, 2027</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-fog">Term Length:</p>
                <p className="text-[11px] text-brand-navy">12 months</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-fog">Auto-Renewal:</p>
                <p className="text-[11px] text-brand-navy">No</p>
              </div>
            </div>
          </div>
          
          {/* Pricing Schedule */}
          <div className="mb-5">
            <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">2. Pricing Schedule</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-1.5 text-left font-normal text-brand-fog">Product</th>
                  <th className="py-1.5 text-right font-normal text-brand-fog">Qty</th>
                  <th className="py-1.5 text-right font-normal text-brand-fog">Unit Price</th>
                  <th className="py-1.5 text-right font-normal text-brand-fog">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-1.5 text-brand-navy">Apex Platform – Growth</td>
                  <td className="py-1.5 text-right text-brand-navy">50</td>
                  <td className="py-1.5 text-right text-brand-navy">$2,400</td>
                  <td className="py-1.5 text-right text-brand-navy">$108,000</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-1.5 text-brand-navy">Implementation Services</td>
                  <td className="py-1.5 text-right text-brand-navy">1</td>
                  <td className="py-1.5 text-right text-brand-navy">$18,000</td>
                  <td className="py-1.5 text-right text-brand-navy">$18,000</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-medium text-brand-fog">
                    Total Contract Value:
                  </td>
                  <td className="py-2 text-right text-[13px] font-semibold text-brand-navy">
                    $186,000
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Billing Terms */}
          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">3. Billing Terms</h3>
            <div className="space-y-1">
              <p className="text-[11px] text-brand-navy">
                <span className="text-brand-fog">Billing Frequency:</span> Annual, billed upfront
              </p>
              <p className="text-[11px] text-brand-navy">
                <span className="text-brand-fog">Payment Terms:</span> Net 30
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
