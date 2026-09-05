'use client'

import { useState, useMemo } from 'react'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import DocumentRow from './DocumentRow'
import styles from './Dashboard.module.css'

export default function DocumentListClient({ documents }: { documents: any[] }) {
  const getBadgeClass = (type: string) => {
    switch(type) {
      case 'Pre-Order': return styles.badgeInvoice; // Reuse Invoice badge for Pre-Order
      case 'Invoice': return styles.badgeInvoice;
      case 'Quotation': return styles.badgeQuotation;
      case 'Delivery Order': return styles.badgeDO;
      default: return '';
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const query = searchQuery.toLowerCase()
    return documents.filter(doc => 
      doc.doc_no?.toLowerCase().includes(query) ||
      doc.work_order_no?.toLowerCase().includes(query) ||
      doc.customer?.name?.toLowerCase().includes(query) ||
      doc.type?.toLowerCase().includes(query)
    )
  }, [documents, searchQuery])

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  
  // Ensure current page is valid after filtering
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by Document No, Work Order No, Customer, or Type..." 
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
              <th>Doc No</th>
              <th>Type</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!paginatedDocs || paginatedDocs.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                    <div className={styles.emptyTitle}>No documents found</div>
                    <div>{searchQuery ? 'No matches for your search.' : 'Create your first document to get started.'}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} badgeClass={getBadgeClass(doc.type)} />
              ))
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
