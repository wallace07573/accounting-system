'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getInvoiceGroups() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('invoice_groups')
    .select('id, name, color')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  return data || []
}

export async function createInvoiceGroup(name: string, color: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return { error: 'No active company' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('invoice_groups')
    .insert({
      tenant_id: tenantId,
      name,
      color
    })
    .select('id, name, color')
    .single()

  if (error) {
    console.error('Error creating group:', error)
    return { error: error.message }
  }

  return { success: true, group: data }
}
