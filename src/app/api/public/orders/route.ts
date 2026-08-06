import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function incrementSequence(sequence: string | null): string {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(2)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')

  if (!sequence) {
    return `Q-${yy}-${mm}-1001`
  }
  const match = sequence.match(/(\d+)(?!.*\d)/)
  if (!match) return sequence + '1'
  
  const numStr = match[1]
  const nextNum = (parseInt(numStr, 10) + 1).toString()
  const paddedNextNum = nextNum.padStart(Math.max(4, numStr.length), '0')
  
  return `Q-${yy}-${mm}-${paddedNextNum}`
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const payload = await request.json()
    
    if (!payload.customer || !payload.customer.name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    
    if (!payload.items || !payload.items.length) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 })
    }

    // 1. Find or create customer
    let customerId = null;
    
    // Try to match by email first
    if (payload.customer.email) {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', payload.customer.email)
        .limit(1)
        .single()
        
      if (existingCust) customerId = existingCust.id
    }
    
    // If not matched, create new
    if (!customerId) {
      const { data: newCust, error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: payload.customer.name,
          email: payload.customer.email || null,
          contact_number: payload.customer.phone || null,
          address: payload.customer.address || null
        })
        .select('id')
        .single()
        
      if (custError) throw new Error('Failed to create customer: ' + custError.message)
      customerId = newCust.id
    }

    // 2. Generate Sequence
    const { data: lastDoc } = await supabase
      .from('documents')
      .select('doc_no')
      .eq('tenant_id', tenantId)
      .eq('type', 'Quotation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const docNo = incrementSequence(lastDoc?.doc_no || null)

    // 3. Insert Document
    const issueDate = new Date().toISOString().split('T')[0]
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        type: 'Quotation',
        doc_no: docNo,
        issue_date: issueDate,
        title: `Online Order - ${payload.customer.name}`,
        is_corporate: false,
        status: 'Draft',
        amount_paid: 0
      })
      .select('id')
      .single()

    if (docError) throw new Error('Failed to create quotation: ' + docError.message)

    // 4. Insert Items
    const documentItems = payload.items.map((item: any) => ({
      document_id: document.id,
      description: item.description,
      qty: item.qty || 1,
      uom: item.uom || 'Unit',
      unit_price: item.unit_price,
      amount: (item.qty || 1) * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('document_items')
      .insert(documentItems)

    if (itemsError) throw new Error('Failed to add quotation items: ' + itemsError.message)

    return NextResponse.json({ success: true, documentId: document.id, doc_no: docNo })
  } catch (error: any) {
    console.error('Error generating quotation from order:', error)
    return NextResponse.json({ error: error.message || 'Failed to process order' }, { status: 500 })
  }
}
