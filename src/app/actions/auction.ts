'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function normalizePhoneNumber(phone?: string) {
  if (!phone) return phone;
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+60')) {
    cleaned = '60' + cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  } else if (cleaned.startsWith('60')) {
    // already starts with 60
  }
  return cleaned;
}

export async function createAuctionRecord(data: {
  date: string;
  name?: string;
  phone_number?: string;
  auction_room: string;
  no: string;
  auc_no: string;
  amount: number;
  remark?: string;
}) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { error: 'Not authenticated' }
  }

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(data.phone_number)
  
  // Try to find a matching customer
  let customerId = null
  if (normalizedPhone) {
    const { data: customerMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('contact_number', normalizedPhone)
      .limit(1)
      .single()
      
    if (customerMatch) {
      customerId = customerMatch.id
    }
  }

  // Auto-create customer if not found
  if (!customerId && data.name) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        attention: normalizedPhone || null,
        contact_number: normalizedPhone || null,
        balance: 0
      })
      .select('id')
      .single()
      
    if (newCustomer) {
      customerId = newCustomer.id
    }
  }

  const { error } = await supabase
    .from('auction_records')
    .insert({
      tenant_id: tenantId,
      ...data,
      phone_number: normalizedPhone,
      created_by: userData.user.id,
      customer_id: customerId
    })

  if (error) {
    console.error('Error creating auction record:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/auctions')
  return { success: true }
}

export async function getAuctionRecords() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return []
  }

  const supabase = await createClient()
  
  // Fetch using the new RPC function to include creator_email
  const { data, error } = await supabase
    .rpc('get_auction_records_with_creator', { p_tenant_id: tenantId })

  if (error) {
    console.error('Error fetching auction records:', error)
    // Fallback if RPC is not yet created
    const { data: fallbackData } = await supabase
      .from('auction_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      
    return fallbackData || []
  }

  return data || []
}

export async function updateAuctionRecord(id: string, data: {
  date: string;
  name?: string;
  phone_number?: string;
  auction_room: string;
  no: string;
  auc_no: string;
  amount: number;
  remark?: string;
}) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()
  
  const normalizedPhone = normalizePhoneNumber(data.phone_number)
  
  let customerId = null
  if (normalizedPhone) {
    const { data: customerMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('contact_number', normalizedPhone)
      .limit(1)
      .single()
      
    if (customerMatch) {
      customerId = customerMatch.id
    }
  }

  // Auto-create customer if not found
  if (!customerId && data.name) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        attention: normalizedPhone || null,
        contact_number: normalizedPhone || null,
        balance: 0
      })
      .select('id')
      .single()
      
    if (newCustomer) {
      customerId = newCustomer.id
    }
  }

  const { error } = await supabase
    .from('auction_records')
    .update({
      ...data,
      phone_number: normalizedPhone,
      customer_id: customerId
    })
    .match({ id, tenant_id: tenantId })

  if (error) {
    console.error('Error updating auction record:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/auctions')
  return { success: true }
}

export async function deleteAuctionRecord(id: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('auction_records')
    .delete()
    .match({ id, tenant_id: tenantId })

  if (error) {
    console.error('Error deleting auction record:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/auctions')
  return { success: true }
}

export async function getAuctionReportData(tenantId: string | undefined, userId: string, month: string) {
  const cookieStore = await cookies()
  const activeTenantId = tenantId || cookieStore.get('active_tenant_id')?.value
  
  if (!activeTenantId) return []

  const supabase = await createClient()

  // month is in YYYY-MM format
  const startDate = `${month}-01`
  // Get last day of month
  const year = parseInt(month.split('-')[0])
  const m = parseInt(month.split('-')[1])
  const lastDay = new Date(year, m, 0).getDate()
  const endDate = `${month}-${lastDay}`

  const { data, error } = await supabase
    .from('auction_records')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .eq('created_by', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching report data:', error)
    return []
  }

  return data || []
}
