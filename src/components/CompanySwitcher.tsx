'use client'

import { useState, useRef, useEffect } from 'react'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { setActiveTenant } from '@/app/actions/tenant'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Tenant = {
  id: string;
  name: string;
  logo_url?: string;
}

export default function CompanySwitcher({ 
  tenants, 
  activeTenantId 
}: { 
  tenants: Tenant[], 
  activeTenantId: string | undefined 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const activeTenant = tenants.find(t => t.id === activeTenantId) || tenants[0]

  const handleSelect = async (id: string) => {
    setIsOpen(false)
    if (id !== activeTenantId) {
      await setActiveTenant(id)
      router.refresh()
    }
  }

  if (!tenants || tenants.length === 0) {
    return (
      <Link 
        href="/dashboard/settings/company" 
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
          backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', 
          textDecoration: 'none', fontSize: '14px', fontWeight: 500
        }}
      >
        <Plus size={16} /> Create Company
      </Link>
    )
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px',
          backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
          cursor: 'pointer', minWidth: '200px', justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '24px', height: '24px', borderRadius: '4px', 
            backgroundColor: '#0f172a', color: 'white', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {activeTenant?.logo_url ? (
              <img src={activeTenant.logo_url} alt={activeTenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Building2 size={14} />
            )}
          </div>
          <span style={{ fontWeight: 500, color: '#0f172a' }}>
            {activeTenant?.name || 'Select Company'}
          </span>
        </div>
        <ChevronsUpDown size={16} color="#64748b" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
          backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', padding: '0 8px' }}>
              YOUR COMPANIES
            </span>
          </div>
          
          <div style={{ padding: '4px' }}>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelect(tenant.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px', border: 'none', backgroundColor: 'transparent',
                  cursor: 'pointer', borderRadius: '4px', textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tenant.logo_url ? (
                    <div style={{ width: '14px', height: '14px', borderRadius: '2px', overflow: 'hidden' }}>
                      <img src={tenant.logo_url} alt={tenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <Building2 size={14} color="#64748b" />
                  )}
                  <span style={{ fontSize: '14px', color: '#334155', fontWeight: activeTenant?.id === tenant.id ? 600 : 400 }}>
                    {tenant.name}
                  </span>
                </div>
                {activeTenant?.id === tenant.id && <Check size={14} color="#2563eb" />}
              </button>
            ))}
          </div>

          <div style={{ padding: '4px', borderTop: '1px solid #f1f5f9' }}>
            <Link 
              href="/dashboard/settings/company?new=true"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', 
                padding: '8px', textDecoration: 'none', color: '#64748b', fontSize: '14px',
                borderRadius: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={14} /> Create New Company
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
