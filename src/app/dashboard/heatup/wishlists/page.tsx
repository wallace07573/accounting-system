'use client'

import React, { useState, useEffect } from 'react'
import { getWishlists, updateWishlistStatus } from '@/app/actions/heatup'
import { Loader2, Search, CheckCircle } from 'lucide-react'

export default function WishlistsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRecords = async () => {
    setIsLoading(true)
    const data = await getWishlists()
    setRecords(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateWishlistStatus(id, newStatus)
    fetchRecords()
  }

  const filteredRecords = records.filter(r => 
    r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.items_requested?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Wishlists</h1>
        <p className="text-slate-500">Manage card requests from HeatUp Collection.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, contact or items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Date</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4 w-1/3">Items Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No wishlist records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">
                      {new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {record.customer_name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {record.contact}
                    </td>
                    <td className="p-4 text-slate-600 whitespace-pre-wrap">
                      {record.items_requested}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        record.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        record.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={record.status}
                        onChange={(e) => handleStatusChange(record.id, e.target.value)}
                        className="text-xs p-1.5 border border-slate-200 rounded outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
