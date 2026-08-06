'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '32px', 
          backgroundColor: '#fee2e2', color: '#dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: '32px'
        }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Something went wrong!</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
          {error.message || "An unexpected error occurred. Please try again or contact support if the issue persists."}
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#0f172a',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
