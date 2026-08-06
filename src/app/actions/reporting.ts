'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getGroupReporting(groupId: string) {
  const supabase = await createClient()
  
  // We fetch documents with their items to sum up the amounts
  const { data: documents, error } = await supabase
    .from('documents')
    .select('status, document_items(amount)')
    .eq('group_id', groupId)

  if (error) {
    console.error('Error fetching reporting data:', error)
    return { verified: 0, paymentReceived: 0, draft: 0 }
  }

  let verified = 0
  let paymentReceived = 0
  let draft = 0

  for (const doc of documents) {
    let total = 0
    if (doc.document_items && Array.isArray(doc.document_items)) {
      total = doc.document_items.reduce((sum, item) => sum + (item.amount || 0), 0)
    }

    if (doc.status === 'Verified') {
      verified += total
    } else if (doc.status === 'Payment Received') {
      paymentReceived += total
    } else if (doc.status === 'Draft') {
      draft += total
    }
  }

  return { verified, paymentReceived, draft }
}
