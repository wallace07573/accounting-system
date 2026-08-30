'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function setActiveTenant(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // Verify the user actually belongs to this tenant
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return

  const cookieStore = await cookies()
  cookieStore.set('active_tenant_id', tenantId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getTenantMembers(tenantId?: string) {
  const cookieStore = await cookies()
  const activeTenantId = tenantId || cookieStore.get('active_tenant_id')?.value
  
  if (!activeTenantId) return []

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('get_tenant_members', { p_tenant_id: activeTenantId })

  if (error) {
    console.error('Error fetching tenant members:', error)
    return []
  }

  return data || []
}

export async function getCurrentUserRole() {
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!activeTenantId) return 'staff'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'staff'

  const { data } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', activeTenantId)
    .eq('user_id', user.id)
    .single()

  if (user.email === 'wallace@anyismart.com') {
    return 'super_admin'
  }

  return data?.role || 'staff'
}

export async function deleteTenant(tenantId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('delete_tenant', { target_tenant_id: tenantId })
  
  if (error) {
    return { error: error.message }
  }

  // Clear active tenant cookie if it matches the deleted one
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value
  
  if (activeTenantId === tenantId) {
    cookieStore.delete('active_tenant_id')
  }

  return { success: true }
}
