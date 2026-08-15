'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { addCustomerTransaction } from './customer'

const DocumentItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Item description cannot be empty'),
  qty: z.number().min(0, 'Item quantity cannot be negative'),
  uom: z.string().optional(),
  unit_price: z.number(),
  amount: z.number(),
  isNew: z.boolean().optional()
}).refine(data => data.unit_price >= 0 || data.description === 'Discount Allowed', {
  message: 'Item price cannot be negative unless it is a Discount',
  path: ['unit_price']
})

const DocumentSchema = z.object({
  type: z.string(),
  doc_no: z.string().min(1, 'Document number is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  is_corporate: z.boolean().optional(),
  show_bank_details: z.boolean().optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  amount_paid: z.number().optional(),
  group_id: z.string().nullable().optional(),
  customer: z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Customer name is required'),
    company_name: z.string().nullable().optional(),
    address: z.string().optional(),
    attention: z.string().optional(),
    email: z.string().nullable().optional()
  }),
  items: z.array(DocumentItemSchema).min(1, 'At least one item is required')
})

type DocumentFormData = z.infer<typeof DocumentSchema>

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
    const parsedData = DocumentSchema.parse(formData)
    const validFormData = parsedData
    // 1. Upsert Customer
    let customerId = validFormData.customer.id
    
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
        type: validFormData.type,
        doc_no: validFormData.doc_no,
        issue_date: validFormData.issue_date,
        due_date: validFormData.due_date || null,
        title: validFormData.title || null,
        is_corporate: validFormData.is_corporate || false,
        show_bank_details: validFormData.show_bank_details || false,
        terms: validFormData.terms || null,
        notes: validFormData.notes || null,
        status: validFormData.status || 'Draft',
        amount_paid: validFormData.amount_paid || 0,
        group_id: validFormData.group_id || null
      })
      .select('id')
      .single()

    if (docError) throw new Error('Failed to create document')

    // 3. Process and Insert Line Items & Upsert Products
    const documentItems = []
    
    for (const item of validFormData.items) {
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

    // Handle Pre-Order balance logic
    if (validFormData.type === 'Pre-Order' && validFormData.amount_paid && validFormData.amount_paid > 0) {
      await addCustomerTransaction(
        customerId,
        validFormData.amount_paid,
        `Payment Received for Pre-Order ${validFormData.doc_no}`
      );
    }

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
  
  // Fetch doc info for Pre-Order logic
  const { data: doc } = await supabase.from('documents').select('type, amount_paid, customer_id, doc_no').eq('id', id).single()

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Delete error:', error)
    return { error: error.message }
  }

  if (doc && doc.type === 'Pre-Order' && doc.amount_paid && doc.amount_paid > 0) {
      await addCustomerTransaction(
        doc.customer_id, 
        -doc.amount_paid, 
        `Pre-Order ${doc.doc_no} deleted`
      );
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
    const parsedData = DocumentSchema.parse(formData)
    const validFormData = parsedData

    // 1. Upsert Customer
    let customerId = validFormData.customer.id
    if (customerId) {
      // Update existing customer details
      const { error: custUpdateError } = await supabase
        .from('customers')
        .update({
          name: validFormData.customer.name,
          company_name: validFormData.customer.company_name || null,
          address: validFormData.customer.address,
          attention: validFormData.customer.attention,
          email: validFormData.customer.email || null
        })
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        
      if (custUpdateError) throw new Error('Failed to update customer')
    } else if (validFormData.customer.name) {
      // Create new customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: validFormData.customer.name,
          company_name: validFormData.customer.company_name || null,
          address: validFormData.customer.address,
          attention: validFormData.customer.attention,
          email: validFormData.customer.email || null
        })
        .select('id')
        .single()
      
      if (custError) throw new Error('Failed to save customer')
      customerId = newCustomer.id
    }

    if (!customerId) {
      throw new Error('Customer details are required')
    }

    // 1.5 Fetch old document for balance calculation
    const { data: oldDoc } = await supabase.from('documents').select('amount_paid, type').eq('id', id).single()
    const oldAmountPaid = oldDoc?.amount_paid || 0;
    const oldType = oldDoc?.type;

    // 2. Update Document
    const { error: docError } = await supabase
      .from('documents')
      .update({
        customer_id: customerId,
        type: validFormData.type,
        doc_no: validFormData.doc_no,
        issue_date: validFormData.issue_date,
        due_date: validFormData.due_date || null,
        title: validFormData.title || null,
        is_corporate: validFormData.is_corporate || false,
        show_bank_details: validFormData.show_bank_details || false,
        terms: validFormData.terms || null,
        notes: validFormData.notes || null,
        status: validFormData.status || 'Draft',
        amount_paid: validFormData.amount_paid || 0,
        group_id: validFormData.group_id || null
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (docError) throw new Error('Failed to update document')

    // 3. Process and Insert Line Items & Upsert Products
    // First delete existing items
    await supabase.from('document_items').delete().eq('document_id', id)

    const documentItems = []
    
    for (const item of validFormData.items) {
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

    // Handle Pre-Order balance logic
    let diff = 0;
    if (oldType === 'Pre-Order' && validFormData.type === 'Pre-Order') {
        diff = (validFormData.amount_paid || 0) - oldAmountPaid;
    } else if (oldType !== 'Pre-Order' && validFormData.type === 'Pre-Order') {
        diff = validFormData.amount_paid || 0;
    } else if (oldType === 'Pre-Order' && validFormData.type !== 'Pre-Order') {
        diff = -oldAmountPaid;
    }

    if (diff !== 0) {
        const remark = `Auto-adjustment for ${validFormData.doc_no} (Type/Amount changed)`;
        await addCustomerTransaction(customerId, diff, remark);
    }

    revalidatePath('/dashboard/documents')
    return { success: true, documentId: id }
  } catch (error: any) {
    console.error('Error updating document:', error)
    return { error: error.message }
  }
}
