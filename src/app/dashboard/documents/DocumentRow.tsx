'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './Dashboard.module.css'
import { EmailButton } from '@/components/EmailButton'

export default function DocumentRow({ doc, badgeClass }: { doc: any, badgeClass: string }) {
  const router = useRouter()

  const handleRowClick = () => {
    router.push(`/dashboard/documents/${doc.id}/edit`)
  }

  return (
    <tr 
      onClick={handleRowClick}
      style={{ 
        cursor: 'pointer', 
        backgroundColor: doc.status === 'Verified' && (!doc.amount_paid || doc.amount_paid <= 0) 
            ? '#fee2e2' // Light red
            : doc.status === 'Verified' 
                ? '#bbf7d0' // Green
                : doc.status === 'Payment Received' 
                    ? '#f0fdf4' // Lighter green
                    : doc.group?.color 
                        ? doc.group.color 
                        : 'transparent'
      }}
      className={styles.clickableRow}
    >
      <td style={{ fontWeight: 600 }}>
        {doc.doc_no}
        {doc.work_order_no && (
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
            WO: {doc.work_order_no}
          </div>
        )}
        {doc.group && (
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 'normal' }}>
            {doc.group.name}
          </div>
        )}
      </td>
      <td>
        <span className={`${styles.badge} ${badgeClass}`}>
          {doc.type}
        </span>
      </td>
      <td>{doc.customer?.name || 'Unknown'}</td>
      <td>{new Date(doc.issue_date).toLocaleDateString()}</td>
      <td>{doc.status}</td>
      <td>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()}>
            <EmailButton documentId={doc.id} defaultEmail={doc.customer?.email} compact={true} />
          </div>
          <Link 
            href={`/preview/${doc.id}`} 
            className={styles.actionButton}
            onClick={(e) => e.stopPropagation()}
          >
            Preview
          </Link>
        </div>
      </td>
    </tr>
  )
}
