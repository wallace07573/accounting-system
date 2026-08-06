'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createPaymentRecord(data: {
  date: string;
  received_from: string;
  amount: number;
  remark?: string;
  is_invoice: boolean;
  invoice_no?: string;
  is_auction?: boolean;
  auction_no?: string;
}) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('payment_received')
    .insert({
      tenant_id: tenantId,
      ...data
    })

  if (error) {
    console.error('Error creating payment record:', error)
    return { error: error.message }
  }

  // Automatically mark the linked invoice as Verified
  if (data.is_invoice && data.invoice_no) {
    await supabase
      .from('documents')
      .update({ status: 'Verified', amount_paid: data.amount })
      .eq('tenant_id', tenantId)
      .eq('doc_no', data.invoice_no)
  }

  // Automatically mark the linked auction as Verified
  if (data.is_auction && data.auction_no) {
    await supabase
      .from('auction_records')
      .update({ status: 'Verified', amount_paid: data.amount })
      .eq('tenant_id', tenantId)
      .eq('auc_no', data.auction_no)
  }

  revalidatePath('/dashboard/payments')
  return { success: true }
}

export async function getPaymentRecords() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payment_received')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payment records:', error)
    return []
  }

  return data || []
}

export async function searchInvoices(query: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return []

  const supabase = await createClient()
  
  // Search for invoices that match the query
  const { data, error } = await supabase
    .from('documents')
    .select('doc_no')
    .eq('tenant_id', tenantId)
    .ilike('type', 'invoice')
    .ilike('doc_no', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching invoices:', error)
    return []
  }

  return data || []
}

export async function searchAuctions(query: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return []

  const supabase = await createClient()
  
  // Search for auctions that match the query
  const { data, error } = await supabase
    .from('auction_records')
    .select('auc_no')
    .eq('tenant_id', tenantId)
    .ilike('auc_no', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching auctions:', error)
    return []
  }

  return data || []
}

export async function updatePaymentRecord(id: string, data: {
  date: string;
  received_from: string;
  amount: number;
  remark?: string;
  is_invoice: boolean;
  invoice_no?: string;
  is_auction?: boolean;
  auction_no?: string;
}) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()

  // Fetch old record to detect reference changes
  const { data: oldRecord } = await supabase
    .from('payment_received')
    .select('*')
    .match({ id, tenant_id: tenantId })
    .single()

  const { error } = await supabase
    .from('payment_received')
    .update(data)
    .match({ id, tenant_id: tenantId })

  if (error) {
    console.error('Error updating payment record:', error)
    return { error: error.message }
  }

  // Restore old linked invoice status if reference changed
  if (oldRecord?.is_invoice && oldRecord?.invoice_no && oldRecord.invoice_no !== data.invoice_no) {
    await supabase
      .from('documents')
      .update({ status: 'Draft', amount_paid: 0 })
      .eq('tenant_id', tenantId)
      .eq('doc_no', oldRecord.invoice_no)
  }

  // Restore old linked auction status if reference changed
  if (oldRecord?.is_auction && oldRecord?.auction_no && oldRecord.auction_no !== data.auction_no) {
    await supabase
      .from('auction_records')
      .update({ status: 'Draft', amount_paid: 0 })
      .eq('tenant_id', tenantId)
      .eq('auc_no', oldRecord.auction_no)
  }

  // Mark new linked invoice as Verified
  if (data.is_invoice && data.invoice_no) {
    await supabase
      .from('documents')
      .update({ status: 'Verified', amount_paid: data.amount })
      .eq('tenant_id', tenantId)
      .eq('doc_no', data.invoice_no)
  }

  // Mark new linked auction as Verified
  if (data.is_auction && data.auction_no) {
    await supabase
      .from('auction_records')
      .update({ status: 'Verified', amount_paid: data.amount })
      .eq('tenant_id', tenantId)
      .eq('auc_no', data.auction_no)
  }

  revalidatePath('/dashboard/payments')
  return { success: true }
}

export async function deletePaymentRecord(id: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active tenant' }
  }

  const supabase = await createClient()

  // Fetch the record first so we can restore linked statuses
  const { data: record } = await supabase
    .from('payment_received')
    .select('*')
    .match({ id, tenant_id: tenantId })
    .single()

  const { error } = await supabase
    .from('payment_received')
    .delete()
    .match({ id, tenant_id: tenantId })

  if (error) {
    console.error('Error deleting payment record:', error)
    return { error: error.message }
  }

  // Restore linked invoice status back to Draft
  if (record?.is_invoice && record?.invoice_no) {
    await supabase
      .from('documents')
      .update({ status: 'Draft', amount_paid: 0 })
      .eq('tenant_id', tenantId)
      .eq('doc_no', record.invoice_no)
  }

  // Restore linked auction status back to Draft
  if (record?.is_auction && record?.auction_no) {
    await supabase
      .from('auction_records')
      .update({ status: 'Draft', amount_paid: 0 })
      .eq('tenant_id', tenantId)
      .eq('auc_no', record.auction_no)
  }

  revalidatePath('/dashboard/payments')
  return { success: true }
}
