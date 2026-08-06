'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProducts(tenantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    throw new Error(error.message)
  }

  return data
}

export async function createProduct(tenantId: string, payload: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...payload, tenant_id: tenantId }])
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/products')
  return data
}

export async function updateProduct(id: string, payload: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/products')
  return data
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/products')
  return true
}
