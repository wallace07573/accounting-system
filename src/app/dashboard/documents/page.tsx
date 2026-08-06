import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
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
    
    // Check role for redirection
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', activeTenantId)
      .eq('user_id', user.id)
      .single()
      
    if (tenantUser?.role === 'staff' && activeTenantName.toLowerCase().includes('heat up')) {
      redirect('/dashboard/auctions')
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
        <Link href="/dashboard/documents/new" className={styles.newButton}>
          <PlusCircle size={20} />
          Create New
        </Link>
      </div>

      <DocumentListClient documents={documents || []} />
    </div>
  )
}
