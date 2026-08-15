'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { formatPhoneNumber } from '@/utils/utils'

export async function deleteCustomer(id: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return { error: 'No active company' }

  const supabase = await createClient()
  
  // First, check if this customer has any associated documents
  const { data: linkedDocs, error: checkError } = await supabase
    .from('documents')
    .select('id')
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .limit(1)

  if (checkError) {
    return { error: 'Error validating customer records' }
  }

  if (linkedDocs && linkedDocs.length > 0) {
    return { error: 'Cannot delete customer. There are documents (invoices/quotations) associated with this customer.' }
  }

  // Check if this customer has any associated auctions
  const { data: linkedAuctions, error: aucCheckError } = await supabase
    .from('auction_records')
    .select('id')
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .limit(1)

  if (aucCheckError) {
    return { error: 'Error validating customer auction records' }
  }

  if (linkedAuctions && linkedAuctions.length > 0) {
    return { error: 'Cannot delete customer. There are auction records associated with this customer.' }
  }
  
  // Safe to delete
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Delete customer error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function updateCustomer(id: string, formData: any) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active company selected' }
  }

  const supabase = await createClient()

  try {
    if (!formData.name?.trim()) throw new Error('Customer name is required');

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: formData.name,
        company_name: formData.company_name || null,
        address: formData.address || null,
        attention: formData.attention ? formatPhoneNumber(formData.attention) : null,
        email: formData.email || null,
        is_verified: formData.is_verified || false,
        bank_name: formData.bank_name || null,
        bank_account_name: formData.bank_account_name || null,
        bank_account_number: formData.bank_account_number || null
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      
    if (updateError) throw new Error('Failed to update customer')

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return { error: error.message }
  }
}

export async function addCustomer(formData: any) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active company selected' }
  }

  const supabase = await createClient()

  try {
    if (!formData.name?.trim()) throw new Error('Customer name is required');

    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: formData.name,
        attention: formData.attention ? formatPhoneNumber(formData.attention) : null,
        email: formData.email || null,
        balance: formData.balance || 0
      })
      .select('id')
      .single()
      
    if (error) throw new Error('Failed to create customer: ' + error.message)

    revalidatePath('/dashboard/customers')
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error('Error adding customer:', error)
    return { error: error.message }
  }
}

export async function addCustomerTransaction(customerId: string, amount: number, remark: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return { error: 'No active company selected' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    // 1. Insert transaction
    const { error: txError } = await supabase
      .from('customer_transactions')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        amount: amount,
        remark: remark,
        created_by: user.id
      })
      
    if (txError) throw new Error('Failed to add transaction: ' + txError.message)

    // 2. Fetch current balance
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError) throw new Error('Failed to fetch customer balance')

    const newBalance = (Number(customer.balance) || 0) + Number(amount)

    // 3. Update customer balance
    const { error: updateError } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId)
      .eq('tenant_id', tenantId)

    if (updateError) throw new Error('Failed to update balance')

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, newBalance }
  } catch (error: any) {
    console.error('Error adding customer transaction:', error)
    return { error: error.message }
  }
}

export async function mergeCustomer(sourceId: string, targetId: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return { error: 'No active company' }

  if (sourceId === targetId) return { error: 'Cannot merge a customer into itself' }

  const supabase = await createClient()

  try {
    // 1. Move documents
    const { error: docError } = await supabase
      .from('documents')
      .update({ customer_id: targetId })
      .eq('customer_id', sourceId)
      .eq('tenant_id', tenantId)
    if (docError) throw new Error('Failed to move documents: ' + docError.message)

    // 1.5 Move auctions
    const { error: aucError } = await supabase
      .from('auction_records')
      .update({ customer_id: targetId })
      .eq('customer_id', sourceId)
      .eq('tenant_id', tenantId)
    if (aucError) throw new Error('Failed to move auctions: ' + aucError.message)

    // 2. Move transactions
    const { error: txError } = await supabase
      .from('customer_transactions')
      .update({ customer_id: targetId })
      .eq('customer_id', sourceId)
      .eq('tenant_id', tenantId)
    if (txError) throw new Error('Failed to move transactions: ' + txError.message)

    // 3. Recalculate balance for target
    const { data: txs, error: fetchTxError } = await supabase
      .from('customer_transactions')
      .select('amount')
      .eq('customer_id', targetId)
      .eq('tenant_id', tenantId)
    
    if (fetchTxError) throw new Error('Failed to fetch merged transactions')
    
    const totalBalance = txs.reduce((sum, tx) => sum + Number(tx.amount), 0)

    const { error: updateError } = await supabase
      .from('customers')
      .update({ balance: totalBalance })
      .eq('id', targetId)
      .eq('tenant_id', tenantId)
    if (updateError) throw new Error('Failed to update merged balance')

    // 4. Delete source customer
    const { error: delError } = await supabase
      .from('customers')
      .delete()
      .eq('id', sourceId)
      .eq('tenant_id', tenantId)
    if (delError) throw new Error('Failed to delete source customer: ' + delError.message)

    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (error: any) {
    console.error('Error merging customer:', error)
    return { error: error.message }
  }
}
