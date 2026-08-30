'use client'

import { useState } from 'react'
import { FileText, Edit, Trash2, CheckCircle, XCircle, Plus, X, Coins, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../../documents/Dashboard.module.css'
import { updateCustomer, deleteCustomer, addCustomerTransaction, mergeCustomer } from '@/app/actions/customer'
import { useToast } from '@/components/Toast'

export default function CustomerDetailClient({ customer, documents, transactions, otherCustomers }: { customer: any, documents: any[], transactions: any[], otherCustomers: any[] }) {
  const [activeTab, setActiveTab] = useState<'history' | 'ledger' | 'edit'>('history')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [txAmount, setTxAmount] = useState('')
  const [txRemark, setTxRemark] = useState('')
  const [txAdding, setTxAdding] = useState(false)

  const [mergeTargetId, setMergeTargetId] = useState('')
  const [merging, setMerging] = useState(false)

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || isNaN(Number(txAmount))) {
      toast('Invalid amount', 'error')
      return
    }
    setTxAdding(true)
    const res = await addCustomerTransaction(customer.id, Number(txAmount), txRemark)
    setTxAdding(false)
    if (res.error) {
      toast(res.error, 'error')
    } else {
      toast('Transaction added successfully', 'success')
      setIsTxModalOpen(false)
      setTxAmount('')
      setTxRemark('')
    }
  }

  const handleMerge = async () => {
    if (!mergeTargetId) {
      toast('Select a customer to merge into', 'error')
      return
    }
    const targetName = otherCustomers.find(c => c.id === mergeTargetId)?.name
    if (!window.confirm(`Are you sure you want to merge ALL history of ${customer.name} into ${targetName}? This will DELETE the current profile and CANNOT be undone.`)) return

    setMerging(true)
    const res = await mergeCustomer(customer.id, mergeTargetId)
    setMerging(false)
    
    if (res.error) {
      toast(res.error, 'error')
    } else {
      toast('Customer merged successfully', 'success')
      router.push(`/dashboard/customers/${mergeTargetId}`)
    }
  }

  // Edit Form State
  const [formData, setFormData] = useState({
    name: customer.name || '',
    company_name: customer.company_name || '',
    attention: customer.attention || '',
    address: customer.address || '',
    email: customer.email || '',
    is_verified: customer.is_verified || false,
    bank_name: customer.bank_name || '',
    bank_account_name: customer.bank_account_name || '',
    bank_account_number: customer.bank_account_number || ''
  })

  const getBadgeClass = (type: string) => {
    switch(type) {
      case 'Pre-Order': return styles.badgeInvoice;
      case 'Invoice': return styles.badgeInvoice;
      case 'Quotation': return styles.badgeQuotation;
      case 'Delivery Order': return styles.badgeDO;
      case 'Auction': return styles.badgeQuotation; // Reusing Quotation badge styling for Auction
      default: return '';
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateCustomer(customer.id, formData)
    setLoading(false)
    if (res.error) {
      toast(res.error, 'error')
    } else {
      toast('Customer profile updated successfully', 'success')
      setActiveTab('history')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}? This cannot be undone.`)) return
    
    setLoading(true)
    const res = await deleteCustomer(customer.id)
    setLoading(false)
    
    if (res.error) {
      toast(res.error, 'error')
    } else {
      toast('Customer deleted successfully', 'success')
      router.push('/dashboard/customers')
    }
  }

  return (
    <div className={styles.card}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: activeTab === 'history' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={18} />
          Document History
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: activeTab === 'ledger' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'ledger' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Coins size={18} />
          Balance Ledger
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: activeTab === 'edit' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'edit' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Edit size={18} />
          Edit Profile
        </button>
      </div>

      {activeTab === 'history' && (() => {
        // Merge and sort documents
        const allRecords = [
          ...(documents || []).map(doc => ({
            id: doc.id,
            no: doc.doc_no,
            type: doc.type,
            date: doc.issue_date,
            amount: doc.items?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0,
            status: doc.status,
            editLink: `/dashboard/documents/${doc.id}/edit`
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Record No</th>
                <th>Type</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                      <div className={styles.emptyTitle}>No records found</div>
                      <div>This customer does not have any documents yet.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                allRecords.map((record) => (
                  <tr key={`${record.type}-${record.id}`}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{record.no}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(record.type)}`}>
                        {record.type}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      RM {Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={styles.statusBadge} data-status={record.status}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link 
                        href={record.editLink}
                        style={{ display: 'inline-flex', padding: '6px', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', textDecoration: 'none' }}
                        title={record.type === 'Auction' ? 'Go to Auctions' : 'Edit Document'}
                      >
                        <Edit size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )
      })()}

      {activeTab === 'ledger' && (
        <div style={{ padding: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Current Balance</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: Number(customer.balance) < 0 ? '#ef4444' : (Number(customer.balance) > 0 ? '#10b981' : '#1e293b') }}>
                RM {Number(customer.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={() => setIsTxModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={18} />
              Add / Deduct Balance
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Remark</th>
                <th style={{ textAlign: 'right' }}>Amount (RM)</th>
              </tr>
            </thead>
            <tbody>
              {!transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className={styles.emptyState}>
                      <Coins size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                      <div className={styles.emptyTitle}>No transactions</div>
                      <div>There are no balance changes recorded for this customer.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ color: '#64748b' }}>{new Date(tx.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 500, color: '#1e293b' }}>{tx.remark || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: Number(tx.amount) > 0 ? '#10b981' : (Number(tx.amount) < 0 ? '#ef4444' : '#1e293b') }}>
                      {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'edit' && (
        <form onSubmit={handleUpdate} style={{ maxWidth: '600px', padding: '12px 24px 24px 24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Customer Name *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Company Name</label>
              <input 
                type="text" 
                value={formData.company_name}
                onChange={e => setFormData({...formData, company_name: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Contact / Attention To</label>
              <input 
                type="text" 
                value={formData.attention}
                onChange={e => setFormData({...formData, attention: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Address</label>
              <textarea 
                rows={3}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="checkbox" 
                  id="is_verified"
                  checked={formData.is_verified}
                  onChange={e => setFormData({...formData, is_verified: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_verified" style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                  Verified Customer
                </label>
              </div>

              {formData.is_verified && (
                <div style={{ display: 'grid', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Bank Name</label>
                    <input 
                      type="text" 
                      value={formData.bank_name}
                      onChange={e => setFormData({...formData, bank_name: e.target.value})}
                      placeholder="e.g. Maybank, CIMB, Public Bank"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Bank Account Name</label>
                    <input 
                      type="text" 
                      value={formData.bank_account_name}
                      onChange={e => setFormData({...formData, bank_account_name: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Bank Account Number</label>
                    <input 
                      type="text" 
                      value={formData.bank_account_number}
                      onChange={e => setFormData({...formData, bank_account_number: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#c2410c', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRightLeft size={18} /> Merge Customer
            </h3>
            <p style={{ fontSize: '14px', color: '#9a3412', margin: '0 0 16px 0' }}>
              Move all documents and transactions to another customer, then delete this profile.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <select 
                value={mergeTargetId}
                onChange={e => setMergeTargetId(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #fdba74', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="">Select target customer...</option>
                {otherCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleMerge}
                disabled={merging || !mergeTargetId}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ea580c', color: 'white', fontWeight: 600, cursor: (merging || !mergeTargetId) ? 'not-allowed' : 'pointer', opacity: (merging || !mergeTargetId) ? 0.5 : 1 }}
              >
                {merging ? 'Merging...' : 'Merge'}
              </button>
            </div>
          </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash2 size={18} />
              Delete Customer
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {isTxModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Adjust Balance</h3>
              <button onClick={() => setIsTxModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Amount (RM) *</label>
                <input required type="number" step="0.01" placeholder="e.g. 500 or -200" value={txAmount} onChange={e => setTxAmount(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>Use positive numbers for prepayments, negative for deductions/debt.</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Remark</label>
                <input type="text" placeholder="e.g. Manual deposit, Refund" value={txRemark} onChange={e => setTxRemark(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsTxModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={txAdding} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 500, cursor: txAdding ? 'not-allowed' : 'pointer' }}>
                  {txAdding ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
