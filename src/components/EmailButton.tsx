'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { sendDocumentEmail } from '@/app/actions/email'
import { useToast } from './Toast'

export function EmailButton({ documentId, defaultEmail, compact = false }: { documentId: string, defaultEmail?: string, compact?: boolean }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    const email = window.prompt("Enter customer's email address:", defaultEmail || '')
    if (!email) return

    setLoading(true)
    const result = await sendDocumentEmail(documentId, email)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
    } else {
      toast(result.message || 'Email sent successfully!', 'success')
    }
  }

  return (
    <button 
      onClick={handleSendEmail} 
      disabled={loading}
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? '0' : '8px',
        padding: compact ? '6px' : '10px 16px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: compact ? '6px' : '8px',
        color: '#475569',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: compact ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => !loading && (e.currentTarget.style.borderColor = '#cbd5e1')}
      onMouseOut={(e) => !loading && (e.currentTarget.style.borderColor = '#e2e8f0')}
      title={compact ? "Send Email" : undefined}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
      {!compact && (loading ? 'Sending...' : 'Send Email')}
    </button>
  )
}
