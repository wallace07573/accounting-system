import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import CustomerListClient from './CustomerListClient'
import styles from '../documents/Dashboard.module.css' // Reusing dashboard styles

export default async function CustomersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

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

  // Fetch customers with their document count
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*, documents(id)')
    .eq('tenant_id', activeTenantId)
    .order('name', { ascending: true })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 className={styles.title}>Customers CRM</h1>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            {activeTenantName}
          </span>
        </div>
      </div>

      <CustomerListClient customers={customers || []} />
    </div>
  )
}
