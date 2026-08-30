import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 60
export const runtime = 'nodejs'

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const host = request.headers.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/preview/${id}`

  let browser
  try {
    browser = await launchBrowser()
    
    const page = await browser.newPage()
    
    const cookies = request.cookies.getAll()
    const puppeteerCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: host?.split(':')[0] || 'localhost',
    }))
    
    if (puppeteerCookies.length > 0) {
      await page.setCookie(...puppeteerCookies)
    }

    await page.goto(url, { waitUntil: 'networkidle0' })
    
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
    browser = null

    const { data: docData } = await supabase
      .from('documents')
      .select('doc_no')
      .eq('id', id)
      .single()
    
    const filename = docData?.doc_no ? `${docData.doc_no}.pdf` : `document-${id}.pdf`

    return new NextResponse(Buffer.from(pdfBuffer), {
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
