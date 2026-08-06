import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 400 })
    }

    const body = await request.json()
    const { name, contact, items_requested } = body

    if (!name || !contact || !items_requested) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert into Supabase
    const { data, error } = await supabase
      .from('heatup_wishlists')
      .insert([
        { 
          tenant_id: tenantId, 
          customer_name: name, 
          contact: contact, 
          items_requested: items_requested,
          status: 'Pending'
        }
      ])
      .select()

    if (error) throw error

    // Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'HeatUp Collection <noreply@system.anyismart.com>', // Updated to verified domain
          to: 'wallace@anyismart.com', // Replace with your receiving email
          subject: `New Wishlist Request from ${name}`,
          html: `
            <h2>New Wishlist Request</h2>
            <p><strong>Customer:</strong> ${name}</p>
            <p><strong>Contact:</strong> ${contact}</p>
            <p><strong>Items Requested:</strong><br/>${items_requested.replace(/\n/g, '<br/>')}</p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // We don't throw here, because the DB insert was successful
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in wishlist route:', error)
    return NextResponse.json({ error: 'Failed to submit wishlist' }, { status: 500 })
  }
}
