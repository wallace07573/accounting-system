'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies, headers } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDocumentEmail(documentId: string, customEmail?: string) {
  try {
    const supabase = await createClient()
    
    // 1. Fetch Document and Customer details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) throw new Error('Document not found')

    const recipientEmail = customEmail || document.customer.email
    if (!recipientEmail) throw new Error('No email address provided or saved for this customer')

    // 2. Fetch PDF Buffer from our local API
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const pdfApiUrl = `${protocol}://${host}/api/generate-pdf?id=${documentId}`

    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')

    const pdfResponse = await fetch(pdfApiUrl, {
      headers: {
        Cookie: cookieHeader
      }
    })

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF for attachment')
    }

    const arrayBuffer = await pdfResponse.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)
    
    // 3. Prepare Email content
    const docTypeStr = document.type.toUpperCase()
    const subject = `${docTypeStr} - ${document.doc_no} from AnyiSmart`
    const filename = `${document.doc_no}.pdf`

    // 4. Send Email via Resend
    const { data, error: sendError } = await resend.emails.send({
      from: 'AnyiSmart <noreply@accounting.anyismart.com>',
      to: [recipientEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Hello ${document.customer.name},</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Please find attached your <strong>${document.type} (${document.doc_no})</strong>.
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            If you have any questions or concerns, please do not hesitate to contact us.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 14px;">
            Thank you,<br/>
            <strong>AnyiSmart Accounting</strong>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        }
      ]
    })

    if (sendError) {
      console.error('Resend Error:', sendError)
      throw new Error(sendError.message)
    }

    return { success: true, message: `Email sent successfully to ${recipientEmail}` }
  } catch (error: any) {
    console.error('Email action error:', error)
    return { error: error.message }
  }
}
