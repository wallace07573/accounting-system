'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getPaymentRecords, createPaymentRecord, searchInvoices, searchAuctions, updatePaymentRecord, deletePaymentRecord } from '@/app/actions/payment'
import { Receipt, Search, Loader2, Plus, Edit2, Trash2, Check, X } from 'lucide-react'

export default function PaymentsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Inline form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receivedFrom, setReceivedFrom] = useState('')
  const [amount, setAmount] = useState('')
  
  const [referenceType, setReferenceType] = useState('none') // 'none', 'invoice', 'auction'
  const [referenceQuery, setReferenceQuery] = useState('')
  const [remark, setRemark] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editReceivedFrom, setEditReceivedFrom] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editReferenceType, setEditReferenceType] = useState('none')
  const [editReferenceQuery, setEditReferenceQuery] = useState('')
  const [editRemark, setEditRemark] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Autocomplete state
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [editShowDropdown, setEditShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLTableDataCellElement>(null)
  const editDropdownRef = useRef<HTMLTableDataCellElement>(null)

  const fetchRecords = async () => {
    setIsLoading(true)
    const data = await getPaymentRecords()
    setRecords(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Handle clicking outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setEditShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Autocomplete search (Add row)
  useEffect(() => {
    if (!referenceQuery || referenceType === 'none') {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    const search = async () => {
      setIsSearching(true)
      if (referenceType === 'invoice') {
        const results = await searchInvoices(referenceQuery)
        setSearchResults(results.map((r: any) => r.doc_no))
      } else if (referenceType === 'auction') {
        const results = await searchAuctions(referenceQuery)
        setSearchResults(results.map((r: any) => r.auc_no))
      }
      setIsSearching(false)
      setShowDropdown(true)
    }
    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [referenceQuery, referenceType])

  // Autocomplete search (Edit row)
  useEffect(() => {
    if (!editReferenceQuery || editReferenceType === 'none' || !editingId) {
      setSearchResults([])
      setEditShowDropdown(false)
      return
    }
    const search = async () => {
      setIsSearching(true)
      if (editReferenceType === 'invoice') {
        const results = await searchInvoices(editReferenceQuery)
        setSearchResults(results.map((r: any) => r.doc_no))
      } else if (editReferenceType === 'auction') {
        const results = await searchAuctions(editReferenceQuery)
        setSearchResults(results.map((r: any) => r.auc_no))
      }
      setIsSearching(false)
      setEditShowDropdown(true)
    }
    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [editReferenceQuery, editReferenceType, editingId])

  const selectReference = (val: string) => {
    setReferenceQuery(val)
    setShowDropdown(false)
    if (!remark) {
      setRemark(`Payment for ${val}`)
    }
  }

  const selectEditReference = (val: string) => {
    setEditReferenceQuery(val)
    setEditShowDropdown(false)
    if (!editRemark) {
      setEditRemark(`Payment for ${val}`)
    }
  }

  const handleAddPayment = async () => {
    if (!date || !receivedFrom || !amount) {
      setError("Please fill in Date, Received From, and Amount.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const data = {
      date,
      received_from: receivedFrom,
      amount: parseFloat(amount),
      remark,
      is_invoice: referenceType === 'invoice' && referenceQuery.trim().length > 0,
      invoice_no: referenceType === 'invoice' ? referenceQuery : undefined,
      is_auction: referenceType === 'auction' && referenceQuery.trim().length > 0,
      auction_no: referenceType === 'auction' ? referenceQuery : undefined
    }

    const result = await createPaymentRecord(data)
    
    if (result.error) {
      setError(result.error)
    } else {
      fetchRecords()
      setReceivedFrom('')
      setAmount('')
      setReferenceQuery('')
      setRemark('')
    }
    setIsSubmitting(false)
  }

  const handleEditClick = (record: any) => {
    setEditingId(record.id)
    setEditDate(record.date.split('T')[0])
    setEditReceivedFrom(record.received_from)
    setEditAmount(record.amount.toString())
    
    if (record.is_auction) {
      setEditReferenceType('auction')
      setEditReferenceQuery(record.auction_no || '')
    } else if (record.is_invoice) {
      setEditReferenceType('invoice')
      setEditReferenceQuery(record.invoice_no || '')
    } else {
      setEditReferenceType('none')
      setEditReferenceQuery('')
    }

    setEditRemark(record.remark || '')
  }

  const handleUpdatePayment = async (id: string) => {
    if (!editDate || !editReceivedFrom || !editAmount) {
      setError("Please fill in Date, Received From, and Amount.")
      return
    }

    setIsUpdating(true)
    setError(null)

    const data = {
      date: editDate,
      received_from: editReceivedFrom,
      amount: parseFloat(editAmount),
      remark: editRemark,
      is_invoice: editReferenceType === 'invoice' && editReferenceQuery.trim().length > 0,
      invoice_no: editReferenceType === 'invoice' ? editReferenceQuery : undefined,
      is_auction: editReferenceType === 'auction' && editReferenceQuery.trim().length > 0,
      auction_no: editReferenceType === 'auction' ? editReferenceQuery : undefined
    }

    const result = await updatePaymentRecord(id, data)
    
    if (result.error) {
      setError(result.error)
    } else {
      setEditingId(null)
      fetchRecords()
    }
    setIsUpdating(false)
  }

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return
    
    setError(null)
    const result = await deletePaymentRecord(id)
    if (result.error) {
      setError(result.error)
    } else {
      fetchRecords()
    }
  }

  const filteredRecords = records.filter(r => 
    r.received_from.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.invoice_no && r.invoice_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.auction_no && r.auction_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.remark && r.remark.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR' 
    }).format(amount)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments Received</h1>
          <p className="text-slate-500 mt-1">Manage and view all incoming payment records.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible flex flex-col relative z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between rounded-t-2xl">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 w-40">Date</th>
                <th className="px-6 py-4 w-1/4">Received From</th>
                <th className="px-6 py-4 w-32">Amount</th>
                <th className="px-6 py-4 w-64">Reference (Invoice / Auction)</th>
                <th className="px-6 py-4">Remark</th>
                <th className="px-6 py-4 w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* INLINE ADD FORM ROW */}
              <tr className="bg-blue-50/30">
                <td className="px-4 py-3 align-top">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    required
                    placeholder="Sender name"
                    value={receivedFrom}
                    onChange={(e) => setReceivedFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-3 align-top relative" ref={dropdownRef}>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={referenceType}
                      onChange={(e) => {
                        setReferenceType(e.target.value)
                        setReferenceQuery('')
                      }}
                      className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      <option value="none">None</option>
                      <option value="invoice">Invoice</option>
                      <option value="auction">Auction</option>
                    </select>
                  </div>
                  {referenceType !== 'none' && (
                    <>
                      <input
                        type="text"
                        placeholder={`Search ${referenceType}...`}
                        value={referenceQuery}
                        onChange={(e) => {
                          setReferenceQuery(e.target.value)
                          setShowDropdown(true)
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                      {showDropdown && referenceQuery && (
                        <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                          {isSearching ? (
                            <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <ul className="py-1">
                              {searchResults.map((val, idx) => (
                                <li 
                                  key={idx}
                                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                                  onClick={() => selectReference(val)}
                                >
                                  {val}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-500">
                              No matches
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    placeholder="Remark..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-3 align-top text-center">
                  <button
                    onClick={handleAddPayment}
                    disabled={isSubmitting || !date || !receivedFrom || !amount}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 w-full"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16}/> Add</>}
                  </button>
                </td>
              </tr>

              {/* LIST EXISTING ROWS */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Receipt size={48} className="text-slate-300" strokeWidth={1.5} />
                      <p className="text-lg font-medium text-slate-600">No previous records</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isEditing = editingId === record.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={record.id} className="bg-slate-50">
                        <td className="px-4 py-3 align-top">
                          <input
                            type="date"
                            required
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            required
                            value={editReceivedFrom}
                            onChange={(e) => setEditReceivedFrom(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 align-top relative" ref={editDropdownRef}>
                          <div className="flex gap-2 mb-2">
                            <select
                              value={editReferenceType}
                              onChange={(e) => {
                                setEditReferenceType(e.target.value)
                                setEditReferenceQuery('')
                              }}
                              className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                              <option value="none">None</option>
                              <option value="invoice">Invoice</option>
                              <option value="auction">Auction</option>
                            </select>
                          </div>
                          {editReferenceType !== 'none' && (
                            <>
                              <input
                                type="text"
                                value={editReferenceQuery}
                                onChange={(e) => {
                                  setEditReferenceQuery(e.target.value)
                                  setEditShowDropdown(true)
                                }}
                                onFocus={() => setEditShowDropdown(true)}
                                className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                              />
                              {editShowDropdown && editReferenceQuery && (
                                <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                                  {isSearching ? (
                                    <div className="p-3 text-center text-xs text-slate-500">
                                      Searching...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <ul className="py-1">
                                      {searchResults.map((val, idx) => (
                                        <li 
                                          key={idx}
                                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                                          onClick={() => selectEditReference(val)}
                                        >
                                          {val}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="p-3 text-center text-xs text-slate-500">
                                      No matches
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            value={editRemark}
                            onChange={(e) => setEditRemark(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdatePayment(record.id)}
                              disabled={isUpdating || !editDate || !editReceivedFrom || !editAmount}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Save"
                            >
                              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  const rowBg = (record.is_invoice || record.is_auction) ? 'bg-[#dcfce7] hover:bg-[#bbf7d0]' : 'hover:bg-slate-50/50';

                  return (
                    <tr key={record.id} className={`transition-colors group ${rowBg}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {record.received_from}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.is_invoice ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {record.invoice_no || 'N/A'}
                          </span>
                        ) : record.is_auction ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            {record.auction_no || 'N/A'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={record.remark}>
                        {record.remark || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
