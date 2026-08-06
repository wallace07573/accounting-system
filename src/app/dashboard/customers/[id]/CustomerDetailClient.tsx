'use client'

import { useState } from 'react'
import { FileText, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../../documents/Dashboard.module.css'
import { updateCustomer, deleteCustomer } from '@/app/actions/customer'
import { useToast } from '@/components/Toast'

export default function CustomerDetailClient({ customer, documents }: { customer: any, documents: any[] }) {
  const [activeTab, setActiveTab] = useState<'history' | 'edit'>('history')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
      case 'Invoice': return styles.badgeInvoice;
      case 'Quotation': return styles.badgeQuotation;
      case 'Delivery Order': return styles.badgeDO;
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

      {activeTab === 'history' && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Doc No</th>
              <th>Type</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!documents || documents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                    <div className={styles.emptyTitle}>No documents found</div>
                    <div>This customer does not have any documents yet.</div>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const totalAmount = doc.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
                
                return (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{doc.doc_no}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{new Date(doc.issue_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      RM {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={styles.statusBadge} data-status={doc.status}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link 
                        href={`/dashboard/documents/${doc.id}/edit`}
                        style={{ display: 'inline-flex', padding: '6px', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', textDecoration: 'none' }}
                      >
                        <Edit size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
    </div>
  )
}
