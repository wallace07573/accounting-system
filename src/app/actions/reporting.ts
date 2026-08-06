'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getGroupReporting(groupId: string) {
  const supabase = await createClient()
  
  // We fetch documents with their items to sum up the amounts
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, doc_no, status, issue_date, type, customer:customers(name), document_items(amount)')
    .eq('group_id', groupId)
    .order('doc_no', { ascending: true })

  if (error) {
    console.error('Error fetching reporting data:', error)
    return { verified: 0, paymentReceived: 0, draft: 0, docsList: [] }
  }

  let verified = 0
  let paymentReceived = 0
  let draft = 0
  const docsList = []

  for (const doc of documents) {
    let total = 0
    if (doc.document_items && Array.isArray(doc.document_items)) {
      total = doc.document_items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    }

    if (doc.status === 'Verified') {
      verified += total
    } else if (doc.status === 'Payment Received') {
      paymentReceived += total
    } else if (doc.status === 'Draft') {
      draft += total
    }

    docsList.push({
      id: doc.id,
      doc_no: doc.doc_no,
      customer_name: doc.customer ? (doc.customer as any).name : 'Unknown',
      status: doc.status,
      issue_date: doc.issue_date,
      type: doc.type,
      amount: total
    })
  }

  return { verified, paymentReceived, draft, docsList }
}
