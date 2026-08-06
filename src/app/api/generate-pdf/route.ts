import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
  }

  // Verify auth first
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current host for puppeteer navigation
  const host = request.headers.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/preview/${id}`

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Forward auth cookies to puppeteer so it can pass RLS
    const cookies = request.cookies.getAll()
    const puppeteerCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: host?.split(':')[0] || 'localhost',
    }))
    
    if (puppeteerCookies.length > 0) {
      await page.setCookie(...puppeteerCookies)
    }

    // Navigate and wait for network idle to ensure fonts/css load
    await page.goto(url, { waitUntil: 'networkidle0' })
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    })

    await browser.close()

    // Fetch doc_no for filename
    const { data: docData } = await supabase
      .from('documents')
      .select('doc_no')
      .eq('id', id)
      .single()
    
    const filename = docData?.doc_no ? `${docData.doc_no}.pdf` : `document-${id}.pdf`

    // Return as PDF file
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    if (browser) await browser.close()
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
