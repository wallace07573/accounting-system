'use client'

import { useState, useMemo } from 'react'
import { Search, Users, ChevronLeft, ChevronRight, Eye, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addCustomer } from '@/app/actions/customer'
import styles from '../documents/Dashboard.module.css'

export default function CustomerListClient({ customers }: { customers: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', attention: '', email: '' })

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    const res = await addCustomer(newCustomer)
    setAdding(false)
    if (res.error) {
      alert(res.error)
    } else {
      setIsAddModalOpen(false)
      setNewCustomer({ name: '', attention: '', email: '' })
      if (res.id) router.push(`/dashboard/customers/${res.id}`)
    }
  }

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.company_name?.toLowerCase().includes(query) ||
      c.attention?.toLowerCase().includes(query)
    )
  }, [customers, searchQuery])

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', justifyItems: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by Name, Company, or Contact..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '8px',
              backgroundColor: '#0f172a', color: 'white',
              border: 'none', fontWeight: 500, fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Add Customer
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Balance</th>
              <th>Contact</th>
              <th>Created At</th>
              <th style={{ textAlign: 'center' }}>Member Level</th>
            </tr>
          </thead>
          <tbody>
            {!paginatedDocs || paginatedDocs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <Users size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                    <div className={styles.emptyTitle}>No customers found</div>
                    <div>{searchQuery ? 'No matches for your search.' : 'You have not added any customers yet.'}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDocs.map((c) => {
                const docCount = c.documents ? c.documents.length : 0;
                let levelText = 'New Customer';
                let levelColor = '#10b981'; // emerald
                let levelBg = '#d1fae5';
                
                if (docCount >= 3 && docCount <= 10) {
                  levelText = 'Regular Customer';
                  levelColor = '#3b82f6'; // blue
                  levelBg = '#dbeafe';
                } else if (docCount > 10) {
                  levelText = 'VIP';
                  levelColor = '#8b5cf6'; // purple
                  levelBg = '#ede9fe';
                }

                return (
                  <tr 
                    key={c.id} 
                    onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ fontWeight: 500, color: '#1e293b' }}>{c.name}</td>
                    <td style={{ fontWeight: 600, color: Number(c.balance) < 0 ? '#ef4444' : (Number(c.balance) > 0 ? '#10b981' : '#64748b') }}>
                      RM {Number(c.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>{c.attention || '-'}</td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: levelColor,
                        backgroundColor: levelBg
                      }}>
                        {levelText}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid #e2e8f0', backgroundColor: currentPage === 1 ? '#f8fafc' : 'white',
              color: currentPage === 1 ? '#94a3b8' : '#334155',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid #e2e8f0', backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white',
              color: currentPage === totalPages ? '#94a3b8' : '#334155',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Add Customer</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Name *</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Contact / Attention</label>
                <input type="text" value={newCustomer.attention} onChange={e => setNewCustomer({...newCustomer, attention: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Email</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={adding} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 500, cursor: adding ? 'not-allowed' : 'pointer' }}>
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
