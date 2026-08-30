import { createClient } from '@/utils/supabase/server'
import DocumentForm from '@/components/DocumentForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params 
  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select(`
      *,
      customer:customers(*),
      items:document_items(*)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (docError || !document) {
    return notFound()
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link 
          href="/dashboard/documents" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}
        >
          <ArrowLeft size={16} />
          Back to Documents
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
          Edit {document.type} ({document.doc_no})
        </h1>
        
        <DocumentForm initialData={document} />
      </div>
    </div>
  )
}
