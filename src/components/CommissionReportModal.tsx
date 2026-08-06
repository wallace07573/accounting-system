'use client'

import React, { useState, useEffect } from 'react'
import { getAuctionReportData } from '@/app/actions/auction'
import { X, Loader2, Download, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface CommissionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  staffList: { email: string; role: string; user_id: string }[];
}

export default function CommissionReportModal({ isOpen, onClose, tenantId, staffList }: CommissionReportModalProps) {
  const [selectedEmail, setSelectedEmail] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  
  // Maps auction_room to commission percentage (default 0)
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  
  const { toast } = useToast()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setRecords([])
      setCommissions({})
      setSelectedEmail('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFetchData = async () => {
    if (!selectedEmail) {
      toast('Please select a staff member', 'error')
      return
    }
    
    setIsLoading(true)
    const selectedStaff = staffList.find(s => s.email === selectedEmail)
    if (!selectedStaff || !selectedStaff.user_id) {
      toast('Could not find user ID for selected staff', 'error')
      setIsLoading(false)
      return
    }

    const data = await getAuctionReportData(tenantId, selectedStaff.user_id, selectedMonth)
    
    if (data.length === 0) {
      toast('No records found for this staff member in the selected month', 'error')
      setIsLoading(false)
      return
    }

    // Extract unique auction rooms
    const uniqueRooms = Array.from(new Set(data.map((r: any) => r.auction_room)))
    const initialCommissions: Record<string, number> = {}
    uniqueRooms.forEach(room => {
      initialCommissions[room as string] = 0 // Default 0%
    })
    
    setRecords(data)
    setCommissions(initialCommissions)
    setStep(2)
    setIsLoading(false)
  }

  const handleCommissionChange = (room: string, value: string) => {
    const num = parseFloat(value) || 0
    setCommissions(prev => ({ ...prev, [room]: num }))
  }

  // Calculations
  const calculateRowCommission = (record: any) => {
    const room = record.auction_room
    const percentage = commissions[room] || 0
    return (Number(record.amount) * percentage) / 100
  }

  const totalSales = records.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalCommission = records.reduce((sum, r) => sum + calculateRowCommission(r), 0)

  const downloadCSV = () => {
    // Build CSV content
    const headers = ['Date', 'Auction No', 'Auction Room', 'Sales Amount (MYR)', 'Remark', 'Commission %', 'Commission Amount (MYR)']
    const rows = records.map(r => [
      r.date,
      r.auc_no,
      r.auction_room,
      Number(r.amount).toFixed(2),
      r.remark || '-',
      commissions[r.auction_room] || 0,
      calculateRowCommission(r).toFixed(2)
    ])
    
    // Add summary row
    rows.push([]) // empty row
    rows.push(['Total Sales', '', '', totalSales.toFixed(2), '', '', ''])
    rows.push(['Total Commission', '', '', '', '', '', totalCommission.toFixed(2)])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Commission_Report_${selectedEmail}_${selectedMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Generate Commission Report</h2>
              <p className="text-sm text-slate-500">Calculate staff commissions based on auction sales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Generate for (Staff)</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={selectedEmail}
                  onChange={e => setSelectedEmail(e.target.value)}
                >
                  <option value="">Select Staff Member...</option>
                  {staffList.map(staff => (
                    <option key={staff.email} value={staff.email}>
                      {staff.email} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <input 
                  type="month" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between border border-blue-100">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Selected Staff</div>
                  <div className="font-semibold text-slate-800">{selectedEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600 font-medium">Period</div>
                  <div className="font-semibold text-slate-800">{selectedMonth}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Set Commission Percentages</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(commissions).map(room => (
                    <div key={room} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-medium text-slate-700">{room}</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          className="w-20 p-1.5 border border-slate-200 rounded-md text-right focus:outline-none focus:border-blue-500"
                          value={commissions[room] === 0 ? '' : commissions[room]}
                          onChange={(e) => handleCommissionChange(room, e.target.value)}
                          placeholder="0"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">Summary ({records.length} records)</h3>
                </div>
                <div className="p-4 grid grid-cols-2 divide-x divide-slate-200">
                  <div className="pr-4 text-center">
                    <div className="text-sm text-slate-500 mb-1">Total Sales</div>
                    <div className="text-2xl font-bold text-slate-800">
                      <span className="text-sm text-slate-500 mr-1">MYR</span>
                      {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="pl-4 text-center">
                    <div className="text-sm text-slate-500 mb-1">Total Commission</div>
                    <div className="text-2xl font-bold text-green-600">
                      <span className="text-sm text-green-600/70 mr-1">MYR</span>
                      {totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
          {step === 2 ? (
            <button 
              onClick={() => setStep(1)} 
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
            >
              Back
            </button>
          ) : (
            <div></div> // empty spacer
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            
            {step === 1 ? (
              <button 
                onClick={handleFetchData}
                disabled={isLoading || !selectedEmail}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Next Step
              </button>
            ) : (
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Download size={16} />
                Download CSV
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
