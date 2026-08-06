'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getLatestSequence(type: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('doc_no')
    .eq('tenant_id', tenantId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.doc_no || null
}

export async function getLastDocumentDetails(type: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select(`
      *,
      customer:customers(*),
      items:document_items(*),
      group:invoice_groups(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data || null
}

export async function searchCustomers(query: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, company_name, address, attention, contact_number')
    .eq('tenant_id', tenantId)
    .or(`name.ilike.%${query}%,company_name.ilike.%${query}%`)
    .limit(10)

  return data || []
}

export async function searchProducts(query: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, description, uom, default_price')
    .eq('tenant_id', tenantId)
    .ilike('name', `%${query}%`)
    .limit(10)

  return data || []
}

export async function getAllProducts() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  if (!tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, description, uom, default_price')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  return data || []
}

export async function saveDocument(formData: any) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active company selected' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // 0. Validation
    if (!formData.doc_no?.trim()) throw new Error('Document number is required');
    if (!formData.issue_date) throw new Error('Issue date is required');
    if (!formData.customer?.name?.trim()) throw new Error('Customer name is required');
    if (!formData.items || formData.items.length === 0) throw new Error('At least one item is required');
    
    // Ensure all items have descriptions and valid numbers
    for (const item of formData.items) {
      if (!item.description?.trim()) throw new Error('Item description cannot be empty');
      if (item.qty < 0) throw new Error('Item quantity cannot be negative');
      if (item.unit_price < 0 && item.description !== 'Discount Allowed') throw new Error('Item price cannot be negative');
    }
    // 1. Upsert Customer
    let customerId = formData.customer.id
    
    if (customerId) {
      // Update existing customer details
      const { error: custUpdateError } = await supabase
        .from('customers')
        .update({
          name: formData.customer.name,
          company_name: formData.customer.company_name || null,
          address: formData.customer.address,
          attention: formData.customer.attention,
          email: formData.customer.email || null
        })
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        
      if (custUpdateError) throw new Error('Failed to update customer')
    } else if (formData.customer.name) {
      // Create new customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: formData.customer.name,
          company_name: formData.customer.company_name || null,
          address: formData.customer.address,
          attention: formData.customer.attention,
          email: formData.customer.email || null
        })
        .select('id')
        .single()
      
      if (custError) throw new Error('Failed to save customer')
      customerId = newCustomer.id
    }

    if (!customerId) {
      throw new Error('Customer details are required')
    }

    // 2. Insert Document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        type: formData.type,
        doc_no: formData.doc_no,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        title: formData.title || null,
        is_corporate: formData.is_corporate || false,
        show_bank_details: formData.show_bank_details || false,
        terms: formData.terms || null,
        notes: formData.notes || null,
        status: formData.status || 'Draft',
        amount_paid: formData.amount_paid || 0,
        group_id: formData.group_id || null
      })
      .select('id')
      .single()

    if (docError) throw new Error('Failed to create document')

    // 3. Process and Insert Line Items & Upsert Products
    const documentItems = []
    
    for (const item of formData.items) {
      if (item.description) {
        if (item.isNew) {
           await supabase.from('products').insert({
             tenant_id: tenantId,
             name: item.description,
             description: item.description,
             uom: item.uom,
             default_price: item.unit_price
           })
        }
      }

      documentItems.push({
        document_id: document.id,
        description: item.description,
        qty: item.qty,
        uom: item.uom || 'Unit',
        unit_price: item.unit_price,
        amount: item.amount
      })
    }

    const { error: itemsError } = await supabase
      .from('document_items')
      .insert(documentItems)

    if (itemsError) throw new Error('Failed to add document items')

    revalidatePath('/dashboard/documents')
    return { success: true, documentId: document.id }
  } catch (error: any) {
    console.error('Error saving document:', error)
    return { error: error.message }
  }
}

import { revalidatePath } from 'next/cache'

export async function deleteDocumentById(id: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return { error: 'No active company' }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Delete error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function updateDocumentStatus(id: string, status: string) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) return { error: 'No active company' }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function updateDocument(id: string, formData: any) {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!tenantId) {
    return { error: 'No active company selected' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // 0. Validation
    if (!formData.doc_no?.trim()) throw new Error('Document number is required');
    if (!formData.issue_date) throw new Error('Issue date is required');
    if (!formData.customer?.name?.trim()) throw new Error('Customer name is required');
    if (!formData.items || formData.items.length === 0) throw new Error('At least one item is required');
    
    for (const item of formData.items) {
      if (!item.description?.trim()) throw new Error('Item description cannot be empty');
      if (item.qty < 0) throw new Error('Item quantity cannot be negative');
      if (item.unit_price < 0 && item.description !== 'Discount Allowed') throw new Error('Item price cannot be negative');
    }

    // 1. Upsert Customer
    let customerId = formData.customer.id
    if (customerId) {
      // Update existing customer details
      const { error: custUpdateError } = await supabase
        .from('customers')
        .update({
          name: formData.customer.name,
          company_name: formData.customer.company_name || null,
          address: formData.customer.address,
          attention: formData.customer.attention,
          email: formData.customer.email || null
        })
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        
      if (custUpdateError) throw new Error('Failed to update customer')
    } else if (formData.customer.name) {
      // Create new customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: formData.customer.name,
          company_name: formData.customer.company_name || null,
          address: formData.customer.address,
          attention: formData.customer.attention,
          email: formData.customer.email || null
        })
        .select('id')
        .single()
      
      if (custError) throw new Error('Failed to save customer')
      customerId = newCustomer.id
    }

    if (!customerId) {
      throw new Error('Customer details are required')
    }

    // 2. Update Document
    const { error: docError } = await supabase
      .from('documents')
      .update({
        customer_id: customerId,
        type: formData.type,
        doc_no: formData.doc_no,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        title: formData.title || null,
        is_corporate: formData.is_corporate || false,
        show_bank_details: formData.show_bank_details || false,
        terms: formData.terms || null,
        notes: formData.notes || null,
        status: formData.status || 'Draft',
        amount_paid: formData.amount_paid || 0,
        group_id: formData.group_id || null
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (docError) throw new Error('Failed to update document')

    // 3. Process and Insert Line Items & Upsert Products
    // First delete existing items
    await supabase.from('document_items').delete().eq('document_id', id)

    const documentItems = []
    
    for (const item of formData.items) {
      if (item.description) {
        if (item.isNew) {
           await supabase.from('products').insert({
             tenant_id: tenantId,
             name: item.description,
             description: item.description,
             uom: item.uom,
             default_price: item.unit_price
           })
        }
      }

      documentItems.push({
        document_id: id,
        description: item.description,
        qty: item.qty,
        uom: item.uom || 'Unit',
        unit_price: item.unit_price,
        amount: item.amount
      })
    }

    const { error: itemsError } = await supabase
      .from('document_items')
      .insert(documentItems)

    if (itemsError) throw new Error('Failed to add document items')

    revalidatePath('/dashboard/documents')
    return { success: true, documentId: id }
  } catch (error: any) {
    console.error('Error updating document:', error)
    return { error: error.message }
  }
}
