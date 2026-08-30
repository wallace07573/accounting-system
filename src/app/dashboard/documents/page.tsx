import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, BarChart3 } from 'lucide-react'
import styles from './Dashboard.module.css'
import { redirect } from 'next/navigation'
import DocumentListClient from './DocumentListClient'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  // Get active tenant name for display
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value
  
  let activeTenantName = 'Unknown Company'
  if (activeTenantId) {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', activeTenantId)
      .single()
    if (tenantData) {
      activeTenantName = tenantData.name
    }
  }

  // Fetch documents for the current tenant (RLS handles filtering)
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*, customer:customers(name), group:invoice_groups(name, color)')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 className={styles.title}>Documents</h1>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            {activeTenantName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/documents/reporting" className={styles.newButton} style={{ backgroundColor: '#475569' }}>
            <BarChart3 size={20} />
            Check Reporting
          </Link>
          <Link href="/dashboard/documents/new" className={styles.newButton}>
            <PlusCircle size={20} />
            Create New
          </Link>
        </div>
      </div>

      <DocumentListClient documents={documents || []} />
    </div>
  )
}
