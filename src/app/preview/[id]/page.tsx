import { createClient } from '@/utils/supabase/server'
import { PremiumDocument } from '@/components/templates/PremiumDocument'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'
import { EmailButton } from '@/components/EmailButton'
import { ArrowLeft } from 'lucide-react'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params
  
  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select(`
      *,
      customer:customers(*),
      tenant:tenants(*),
      items:document_items(*)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (docError || !document) {
    return notFound()
  }

  // Map database model to component props
  const tenantData = {
    name: document.tenant.name,
    logo_url: document.tenant.logo_url,
    brand_color: document.tenant.brand_color,
    address: document.tenant.address,
    phone: document.tenant.phone,
    email: document.tenant.email,
    bank_name: document.tenant.bank_name,
    bank_account_number: document.tenant.bank_account_number,
    bank_account_name: document.tenant.bank_account_name,
    ssm_number: document.tenant.ssm_number
  }

  const customerData = {
    name: document.customer.name,
    company_name: document.customer.company_name,
    address: document.customer.address,
    attention: document.customer.attention
  }

  const docData = {
    type: (document.type === 'Pre-Order' ? 'Invoice' : document.type) as 'Invoice' | 'Quotation' | 'Delivery Order',
    doc_no: document.doc_no,
    work_order_no: document.work_order_no,
    issue_date: document.issue_date,
    due_date: document.due_date,
    title: document.title,
    is_corporate: document.is_corporate,
    show_bank_details: document.show_bank_details,
    terms: document.terms,
    items: document.items.map((item: any) => ({
      description: item.description,
      qty: item.qty,
      uom: item.uom,
      unit_price: item.unit_price,
      amount: item.amount
    }))
  }

  return (
    <div className="preview-container" style={{ backgroundColor: '#e5e7eb', minHeight: '100vh', padding: '2rem 0' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .document-wrapper {
          overflow-x: auto;
          padding-bottom: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        @media print {
          .preview-container {
            padding: 0 !important;
            background-color: white !important;
          }
          .document-wrapper {
            padding-bottom: 0 !important;
            gap: 0 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Action Bar */}
      <div className="no-print" style={{ 
        maxWidth: '210mm', 
        margin: '0 auto 20px auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Link href="/dashboard/documents" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#475569', 
          textDecoration: 'none', 
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <ArrowLeft size={18} />
          Back to Documents
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <EmailButton documentId={resolvedParams.id} defaultEmail={document.customer?.email} />
          <PrintButton />
        </div>
      </div>

      <div className="document-wrapper">
        <PremiumDocument tenant={tenantData} customer={customerData} document={docData} />
      </div>
    </div>
  )
}
