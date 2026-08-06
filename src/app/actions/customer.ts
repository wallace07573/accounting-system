'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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
        attention: formData.attention || null,
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
