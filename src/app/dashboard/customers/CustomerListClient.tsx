'use client'

import { useState, useMemo } from 'react'
import { Search, Users, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../documents/Dashboard.module.css'

export default function CustomerListClient({ customers }: { customers: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)

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

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company Name</th>
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
                    <td>{c.company_name || '-'}</td>
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
    </>
  )
}
