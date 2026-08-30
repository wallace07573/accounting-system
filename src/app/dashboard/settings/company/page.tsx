import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CompanySettingsForm from './CompanySettingsForm'

export default async function CompanySettingsPage({
  searchParams,
}: {
  searchParams: { new?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const isNew = resolvedSearchParams.new === 'true'
  
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  let tenant = null
  
  if (!isNew && activeTenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', activeTenantId)
      .single()
      
    tenant = data
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {isNew || !tenant ? 'Create New Company' : 'Company Profile'}
        </h1>
        <p style={{ color: '#64748b' }}>
          {isNew || !tenant 
            ? 'Set up a new workspace for your business.' 
            : 'Manage your company details and logo for invoices.'}
        </p>
      </div>

      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px' }}>
        <CompanySettingsForm key={tenant?.id || 'new'} initialData={tenant} userId={user.id} />
      </div>
    </div>
  )
}
