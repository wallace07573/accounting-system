import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, uom, default_price, image_url')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('Error fetching public products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
