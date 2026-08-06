'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getWishlists() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  if (!activeTenantId) return []

  const { data, error } = await supabase
    .from('heatup_wishlists')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlists:', error)
    return []
  }

  return data || []
}

export async function getPreorders() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  if (!activeTenantId) return []

  const { data, error } = await supabase
    .from('heatup_preorders')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching preorders:', error)
    return []
  }

  return data || []
}

export async function updateWishlistStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('heatup_wishlists')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function updatePreorderStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('heatup_preorders')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) {
    return { error: error.message }
  }

  return { data }
}
