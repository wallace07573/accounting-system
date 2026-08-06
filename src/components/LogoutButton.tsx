'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        marginLeft: '8px'
      }}
      title="Logout"
    >
      <LogOut size={16} />
    </button>
  )
}
