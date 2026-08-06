import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ReportingClient from './ReportingClient'
import { cookies } from 'next/headers'

export default async function ReportingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  if (!activeTenantId) {
    redirect('/dashboard')
  }

  // Fetch groups for the dropdown
  const { data: groups, error } = await supabase
    .from('invoice_groups')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('name', { ascending: true })

  return <ReportingClient groups={groups || []} />
}
