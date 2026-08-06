import Link from 'next/link'
import styles from '../Dashboard.module.css'
import { ArrowLeft } from 'lucide-react'
import DocumentForm from '@/components/DocumentForm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function NewDocumentPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  let tenant = null
  if (activeTenantId) {
    const { data } = await supabase.from('tenants').select('enable_heat_up_po').eq('id', activeTenantId).single()
    tenant = data
  }

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
        <DocumentForm tenant={tenant} />
      </div>
    </div>
  )
}
