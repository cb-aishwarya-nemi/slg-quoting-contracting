import { useState, useRef, useEffect } from 'react'
import { FileText, ZoomIn, ZoomOut, Download, ChevronDown } from 'lucide-react'
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
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
      {/* Control Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 transition-colors hover:bg-neutral-100"
          >
            <FileText size={16} className="text-brand-fog" />
            <span className="text-[13px] font-medium text-brand-navy">
              {truncateFileName(selectedPdf.name)}
            </span>
            <ChevronDown size={14} className="text-brand-fog" />
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
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[12px] text-brand-fog">70%</span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
            >
              <ZoomIn size={14} />
            </button>
          </div>
          
          {/* Download */}
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      
      {/* Document Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Page 1 */}
          <div className="mx-auto max-w-[520px] rounded border border-neutral-200 bg-white p-8 shadow-sm">
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
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider ai-gradient-text">
                  Customer
                </p>
                <div className="rounded-md p-[1.5px] ai-gradient">
                  <div className="rounded-[4.5px] bg-white p-3">
                    <p className="text-[12px] font-semibold text-brand-navy">Pioneer Systems Corp.</p>
                    <p className="text-[11px] font-medium text-brand-navy">Pioneer Systems</p>
                    <p className="mt-1 text-[11px] text-brand-fog">Contact: Alex Nguyen</p>
                    <p className="text-[11px] text-brand-fog">alex.nguyen@pioneersystems.com</p>
                  </div>
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

          {/* Page 2 */}
          <div className="mx-auto max-w-[520px] rounded border border-neutral-200 bg-white p-8 shadow-sm">
            {/* Service Level Agreement */}
            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">4. Service Level Agreement</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-brand-fog">Uptime Guarantee:</p>
                  <p className="text-[11px] text-brand-navy">99.9% monthly uptime</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-fog">Support Response Time:</p>
                  <p className="text-[11px] text-brand-navy">Critical: 1 hour, High: 4 hours, Normal: 24 hours</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-fog">Maintenance Windows:</p>
                  <p className="text-[11px] text-brand-navy">Sundays 2:00 AM - 6:00 AM UTC</p>
                </div>
              </div>
            </div>

            {/* Data & Security */}
            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">5. Data & Security</h3>
              <div className="space-y-2 text-[11px]">
                <p className="text-brand-navy">
                  • All data encrypted in transit (TLS 1.3) and at rest (AES-256)
                </p>
                <p className="text-brand-navy">
                  • SOC 2 Type II and ISO 27001 certified
                </p>
                <p className="text-brand-navy">
                  • GDPR and CCPA compliant
                </p>
                <p className="text-brand-navy">
                  • Daily automated backups with 30-day retention
                </p>
              </div>
            </div>

            {/* Termination */}
            <div>
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">6. Termination</h3>
              <p className="text-[11px] leading-relaxed text-brand-navy">
                Either party may terminate this Agreement with 60 days written notice. 
                Upon termination, Customer will have 30 days to export all data from the platform.
              </p>
            </div>
          </div>

          {/* Page 3 */}
          <div className="mx-auto max-w-[520px] rounded border border-neutral-200 bg-white p-8 shadow-sm">
            {/* Intellectual Property */}
            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">7. Intellectual Property</h3>
              <p className="mb-3 text-[11px] leading-relaxed text-brand-navy">
                Chargebee retains all rights, title, and interest in the Platform and Services. 
                Customer retains all rights to their data and content.
              </p>
              <p className="text-[11px] leading-relaxed text-brand-navy">
                Customer grants Chargebee a limited license to process and store Customer data 
                solely for the purpose of providing the Services.
              </p>
            </div>

            {/* Liability & Indemnification */}
            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">8. Liability & Indemnification</h3>
              <p className="mb-2 text-[11px] leading-relaxed text-brand-navy">
                Chargebee's total liability shall not exceed the fees paid by Customer in the 12 months 
                preceding the claim.
              </p>
              <p className="text-[11px] leading-relaxed text-brand-navy">
                Neither party shall be liable for indirect, incidental, special, or consequential damages.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-6">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">9. Governing Law</h3>
              <p className="text-[11px] leading-relaxed text-brand-navy">
                This Agreement shall be governed by the laws of the State of California, USA, 
                without regard to conflict of law principles.
              </p>
            </div>

            {/* Signatures */}
            <div className="border-t border-neutral-100 pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-brand-fog">Provider</p>
                  <div className="mb-4 border-b border-neutral-200 pb-1">
                    <p className="text-[12px] font-medium text-brand-navy">Sarah Mitchell</p>
                  </div>
                  <p className="text-[11px] text-brand-fog">VP of Sales, Chargebee Inc.</p>
                  <p className="text-[11px] text-brand-fog">Date: May 1, 2026</p>
                </div>
                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-brand-fog">Customer</p>
                  <div className="mb-4 border-b border-neutral-200 pb-1">
                    <p className="text-[12px] font-medium text-brand-navy">Alex Nguyen</p>
                  </div>
                  <p className="text-[11px] text-brand-fog">CTO, Pioneer Systems Corp.</p>
                  <p className="text-[11px] text-brand-fog">Date: May 1, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Page 4 */}
          <div className="mx-auto max-w-[520px] rounded border border-neutral-200 bg-white p-8 shadow-sm">
            {/* Appendix A - Technical Specifications */}
            <div className="mb-6 text-center">
              <h2 className="font-heading text-[16px] font-semibold text-brand-navy">
                APPENDIX A
              </h2>
              <p className="mt-1 text-[11px] text-brand-fog">Technical Specifications</p>
            </div>

            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">API Access</h3>
              <div className="space-y-2 text-[11px]">
                <p className="text-brand-navy">
                  • RESTful API with rate limit of 10,000 requests/hour
                </p>
                <p className="text-brand-navy">
                  • Webhook support for real-time event notifications
                </p>
                <p className="text-brand-navy">
                  • OAuth 2.0 authentication
                </p>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">Integration Support</h3>
              <div className="space-y-2 text-[11px]">
                <p className="text-brand-navy">
                  • Pre-built integrations: Salesforce, HubSpot, Stripe, PayPal
                </p>
                <p className="text-brand-navy">
                  • Custom integration support via API
                </p>
                <p className="text-brand-navy">
                  • SSO support (SAML 2.0, OIDC)
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[12px] font-semibold text-brand-navy">Reporting & Analytics</h3>
              <div className="space-y-2 text-[11px]">
                <p className="text-brand-navy">
                  • Real-time dashboard with customizable widgets
                </p>
                <p className="text-brand-navy">
                  • Scheduled reports via email (daily, weekly, monthly)
                </p>
                <p className="text-brand-navy">
                  • Export data in CSV, Excel, and JSON formats
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
