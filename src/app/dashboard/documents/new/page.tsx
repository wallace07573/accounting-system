import Link from 'next/link'
import styles from '../Dashboard.module.css'
import { ArrowLeft } from 'lucide-react'
import DocumentForm from '@/components/DocumentForm'

export default async function NewDocumentPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard/documents" style={{ color: '#64748b', textDecoration: 'none' }}>
            <ArrowLeft size={24} />
          </Link>
          <h1 className={styles.title}>Create Document</h1>
        </div>
      </div>

      <div className={styles.card} style={{ padding: '30px' }}>
        <DocumentForm />
      </div>
    </div>
  )
}
