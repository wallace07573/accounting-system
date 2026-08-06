'use client'

import React, { useState, useEffect } from 'react'
import { getGroupReporting } from '@/app/actions/reporting'
import { ArrowLeft, Loader2, BarChart3, CheckCircle2, DollarSign, FileEdit } from 'lucide-react'
import Link from 'next/link'

export default function ReportingClient({ groups }: { groups: any[] }) {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState({ verified: 0, paymentReceived: 0, draft: 0 })

  useEffect(() => {
    if (!selectedGroup) return

    const fetchReport = async () => {
      setIsLoading(true)
      const data = await getGroupReporting(selectedGroup)
      setReportData(data)
      setIsLoading(false)
    }

    fetchReport()
  }, [selectedGroup])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)
  }

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Group Reporting</h1>
            <p className="text-slate-500">Select an invoice group to view its financial summary.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Group</label>
        <select 
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-900"
        >
          <option value="" disabled>-- Choose a Group --</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroup ? (
        <div className="flex flex-col gap-6 relative">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            )}

            {/* Verified Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Verified Amount</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(reportData.verified)}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <CheckCircle2 size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-500">Total amount of verified invoices</p>
            </div>

            {/* Payment Received Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Payment Received</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(reportData.paymentReceived)}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-500">Total amount successfully collected</p>
            </div>

            {/* Draft Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-400"></div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Draft Amount</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(reportData.draft)}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                  <FileEdit size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-500">Total amount of draft invoices</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Document Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4 pl-6">Document No</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reportData.docsList && reportData.docsList.length > 0 ? (
                    reportData.docsList.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-medium text-slate-900">{doc.doc_no}</td>
                        <td className="p-4 text-slate-600">{doc.customer_name}</td>
                        <td className="p-4 text-slate-600">{doc.type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            doc.status === 'Verified' ? 'bg-blue-100 text-blue-700' :
                            doc.status === 'Payment Received' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 font-semibold text-slate-800">
                          {formatCurrency(doc.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        {isLoading ? 'Loading documents...' : 'No documents found for this group.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <BarChart3 className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">No Group Selected</h3>
          <p className="text-slate-500">Please select a group from the dropdown to view its report.</p>
        </div>
      )}
    </div>
  )
}
