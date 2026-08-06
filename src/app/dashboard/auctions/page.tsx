'use client'

import React, { useState, useEffect } from 'react'
import { getAuctionRecords, createAuctionRecord, updateAuctionRecord, deleteAuctionRecord } from '@/app/actions/auction'
import { getTenantMembers, getCurrentUserRole } from '@/app/actions/tenant'
import { useToast } from '@/components/Toast'
import { Gavel, Search, Loader2, Plus, Edit2, Trash2, Check, X, FileSpreadsheet } from 'lucide-react'
import CommissionReportModal from '@/components/CommissionReportModal'

const AUCTION_ROOMS = [
  { label: 'Auc 1', prefix: 'AUC-1' },
  { label: 'Auc 2', prefix: 'AUC-2' },
  { label: 'Auc 3', prefix: 'AUC-3' },
  { label: 'Premium', prefix: 'AUC-PREMIUM' },
  { label: 'OP Auc 1', prefix: 'OPAUC-1' },
  { label: 'OP Premium', prefix: 'OP-PREMIUM' }
]

export default function AuctionsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // Inline form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [auctionRoom, setAuctionRoom] = useState('Auc 1')
  const [no, setNo] = useState('')
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editName, setEditName] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')
  const [editAuctionRoom, setEditAuctionRoom] = useState('')
  const [editNo, setEditNo] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editRemark, setEditRemark] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [staffList, setStaffList] = useState<{email: string, role: string, user_id: string}[]>([])

  // Role state
  const [currentUserRole, setCurrentUserRole] = useState<string>('staff')

  const fetchRecords = async () => {
    setIsLoading(true)
    const data = await getAuctionRecords()
    setRecords(data)
    setIsLoading(false)
  }

  const fetchStaff = async () => {
    // getTenantMembers automatically uses active_tenant_id from cookies
    const data = await getTenantMembers()
    const formatted = data.map((d: any) => ({
      email: d.email || '',
      role: d.role,
      user_id: d.user_id
    })).filter((s: any) => s.email)
    setStaffList(formatted)
  }

  const fetchRole = async () => {
    const role = await getCurrentUserRole()
    setCurrentUserRole(role)
  }

  useEffect(() => {
    fetchRecords()
    fetchStaff()
    fetchRole()
  }, [])

  const generateAucNo = (roomLabel: string, number: string) => {
    const room = AUCTION_ROOMS.find(r => r.label === roomLabel)
    if (!room || !number) return ''
    return `${room.prefix}-${number}`
  }

  const handleAddRow = async () => {
    setError(null)
    if (amount === '' || isNaN(Number(amount))) {
      setError('Please enter a valid amount')
      return
    }
    if (!no) {
      setError('Please enter an Auction No')
      return
    }

    setIsSubmitting(true)
    
    const aucNo = generateAucNo(auctionRoom, no)

    const res = await createAuctionRecord({
      date,
      name,
      phone_number: phoneNumber,
      auction_room: auctionRoom,
      no,
      auc_no: aucNo,
      amount: Number(amount),
      remark
    })

    if (res.error) {
      setError(res.error)
    } else {
      // Reset form
      setName('')
      setPhoneNumber('')
      setNo('')
      setAmount('')
      setRemark('')
      fetchRecords()
    }
    
    setIsSubmitting(false)
  }

  const handleStartEdit = (record: any) => {
    setEditingId(record.id)
    setEditDate(record.date)
    setEditName(record.name || '')
    setEditPhoneNumber(record.phone_number || '')
    setEditAuctionRoom(record.auction_room)
    setEditNo(record.no)
    setEditAmount(record.amount.toString())
    setEditRemark(record.remark || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (editAmount === '' || isNaN(Number(editAmount))) {
      toast('Please enter a valid amount', 'error')
      return
    }
    if (!editNo) {
      toast('Please enter an Auction No', 'error')
      return
    }

    setIsUpdating(true)
    const aucNo = generateAucNo(editAuctionRoom, editNo)
    
    const res = await updateAuctionRecord(id, {
      date: editDate,
      name: editName,
      phone_number: editPhoneNumber,
      auction_room: editAuctionRoom,
      no: editNo,
      auc_no: aucNo,
      amount: Number(editAmount),
      remark: editRemark
    })

    if (res.error) {
      toast(res.error, 'error')
    } else {
      setEditingId(null)
      toast('Auction record updated successfully')
      fetchRecords()
    }
    setIsUpdating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    const res = await deleteAuctionRecord(id)
    if (res.error) {
      toast(res.error, 'error')
    } else {
      toast('Auction record deleted successfully')
      fetchRecords()
    }
  }

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone_number?.includes(searchQuery) ||
    r.auc_no?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: '#0f172a'
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Auction Records</h1>
          <p className="text-slate-500">Manage and view all auction records.</p>
        </div>
        {(currentUserRole === 'owner' || currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Generate Report
          </button>
        )}
      </div>

      <CommissionReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        tenantId="" 
        staffList={staffList} 
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Mobile Add Form (Hidden on Desktop) */}
        <div className="md:hidden p-4 border-b border-slate-200 bg-blue-50/30 flex flex-col gap-3">
          <div className="font-semibold text-slate-700 text-sm mb-1">Add New Record</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Phone</label>
              <input type="text" placeholder="Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Room</label>
              <select value={auctionRoom} onChange={e => setAuctionRoom(e.target.value)} style={inputStyle}>
                {AUCTION_ROOMS.map(r => (
                  <option key={r.label} value={r.label}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">No</label>
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="No" value={no} onChange={e => setNo(e.target.value)} style={{...inputStyle, width: '60px'}} />
                <span className="text-slate-400 text-xs truncate">{generateAucNo(auctionRoom, no) || 'Auto'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amount (MYR)</label>
              <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Remark</label>
              <input type="text" placeholder="Remark (Optional)" value={remark} onChange={e => setRemark(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button 
            onClick={handleAddRow}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add Record</>}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 min-w-[160px]">Date</th>
                <th className="p-4 min-w-[150px]">Name</th>
                <th className="p-4 min-w-[150px]">Phone Number</th>
                <th className="p-4 min-w-[140px]">Auction Room</th>
                <th className="p-4 min-w-[100px]">No</th>
                <th className="p-4 min-w-[130px]">Auc No</th>
                <th className="p-4 min-w-[130px]">Amount</th>
                <th className="p-4 min-w-[150px]">Remark</th>
                <th className="p-4 min-w-[150px]">Keyed In By</th>
                <th className="p-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {/* Inline Add Row (Hidden on Mobile) */}
              <tr className="bg-blue-50/30 hidden md:table-row">
                <td className="p-3">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <input type="text" placeholder="Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <select value={auctionRoom} onChange={e => setAuctionRoom(e.target.value)} style={inputStyle}>
                    {AUCTION_ROOMS.map(r => (
                      <option key={r.label} value={r.label}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <input type="text" placeholder="No" value={no} onChange={e => setNo(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <span className="text-slate-400 text-xs">{generateAucNo(auctionRoom, no) || 'Auto'}</span>
                </td>
                <td className="p-3">
                  <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <input type="text" placeholder="Remark" value={remark} onChange={e => setRemark(e.target.value)} style={inputStyle} />
                </td>
                <td className="p-3">
                  <span className="text-slate-400 text-xs">-</span>
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={handleAddRow}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-1 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add</>}
                  </button>
                </td>
              </tr>

              {/* Data Rows */}
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No auction records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  let rowBg = 'hover:bg-slate-50 transition-colors';
                  if (record.status === 'Verified') {
                    if (Number(record.amount_paid) === 0) {
                      rowBg = 'bg-red-100 hover:bg-red-200 transition-colors';
                    } else {
                      rowBg = 'bg-[#dcfce7] hover:bg-[#bbf7d0] transition-colors';
                    }
                  }

                  return (
                  <tr key={record.id} className={rowBg}>
                    {editingId === record.id ? (
                      // Edit Mode
                      <>
                        <td className="p-3">
                          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputStyle} />
                        </td>
                        <td className="p-3">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                        </td>
                        <td className="p-3">
                          <input type="text" value={editPhoneNumber} onChange={e => setEditPhoneNumber(e.target.value)} style={inputStyle} />
                        </td>
                        <td className="p-3">
                          <select value={editAuctionRoom} onChange={e => setEditAuctionRoom(e.target.value)} style={inputStyle}>
                            {AUCTION_ROOMS.map(r => (
                              <option key={r.label} value={r.label}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input type="text" value={editNo} onChange={e => setEditNo(e.target.value)} style={inputStyle} />
                        </td>
                        <td className="p-3 text-slate-600 font-medium text-xs">
                          {generateAucNo(editAuctionRoom, editNo)}
                        </td>
                        <td className="p-3">
                          <input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} />
                        </td>
                        <td className="p-3">
                          <input type="text" value={editRemark} onChange={e => setEditRemark(e.target.value)} placeholder="Remark" style={inputStyle} />
                        </td>
                        <td className="p-3">
                          <span className="text-slate-500 text-xs">{record.creator_email || '-'}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleSaveEdit(record.id)}
                              disabled={isUpdating}
                              className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              disabled={isUpdating}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="p-4 text-slate-600">
                          {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          {record.name || '-'}
                        </td>
                        <td className="p-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>{record.phone_number || '-'}</span>
                            {record.customer_id && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase" title="Linked to Customer">Linked</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          {record.auction_room}
                        </td>
                        <td className="p-4 text-slate-600">
                          {record.no}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                            {record.auc_no}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          MYR {Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-slate-600 text-sm">
                          {record.remark || '-'}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">
                          {record.creator_email || '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleStartEdit(record)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
