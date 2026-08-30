import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TeamManagement from './TeamManagement'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  if (!activeTenantId) {
    redirect('/dashboard/settings/company?new=true')
  }

  // Fetch current company
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', activeTenantId)
    .single()

  // Fetch current members using RPC to bypass public auth.users join limitation
  const { data: members } = await supabase
    .rpc('get_tenant_members', { p_tenant_id: activeTenantId })


  // Fetch pending invites
  const { data: invites } = await supabase
    .from('tenant_invites')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Team Members
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage who has access to {tenant?.name || 'this company'}.
        </p>
      </div>

      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <TeamManagement 
          key={activeTenantId}
          tenantId={activeTenantId} 
          members={members || []} 
          invites={invites || []} 
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
