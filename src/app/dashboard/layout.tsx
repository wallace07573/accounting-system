import { createClient } from '@/utils/supabase/server'
import AutoSetTenant from '@/components/AutoSetTenant'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompanySwitcher from '@/components/CompanySwitcher'
import { cookies } from 'next/headers'
import { Settings, Users, FileText } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Fetch all tenants the user has access to
  const { data: tenantUsers, error: tuError } = await supabase
    .from('tenant_users')
    .select('role, tenant:tenants(id, name, logo_url)')
    .eq('user_id', user.id)


  const tenants = tenantUsers?.map((tu: any) => tu.tenant) || []
  
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  // Ensure an active tenant is selected if they have tenants
  if (tenants.length > 0 && (!activeTenantId || !tenants.find((t: any) => t.id === activeTenantId))) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <AutoSetTenant tenantId={tenants[0].id} />
        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Loading Workspace</h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Please wait while we set up your session...</p>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    )
  }

  // Determine if we should show the Payments menu
  const activeTenant = tenants.find((t: any) => t.id === activeTenantId)
  const activeTenantUser = tenantUsers?.find((tu: any) => tu.tenant?.id === activeTenantId)
  const isHeatUpCollection = activeTenant?.name?.toLowerCase().includes('heat up')
  const isOwner = activeTenantUser?.role === 'owner' || activeTenantUser?.role === 'admin' || activeTenantUser?.role === 'super_admin' || user.email === 'wallace@anyismart.com'
  const isStaff = activeTenantUser?.role === 'staff'
  const isHeatUpStaff = isHeatUpCollection && isStaff

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between md:h-16 gap-3 md:gap-0 py-3 md:py-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/dashboard/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="white" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                DocGen SaaS
              </span>
            </Link>
            
            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-3">
              <CompanySwitcher tenants={tenants} activeTenantId={activeTenantId} />
              <LogoutButton />
            </div>
          </div>
          
          <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 w-full md:w-auto md:mx-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {!isHeatUpStaff && (
              <>
                <Link href="/dashboard/documents" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Documents</Link>
                <Link href="/dashboard/products" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Products</Link>
                <Link href="/dashboard/customers" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Customers</Link>
              </>
            )}
            
            {isHeatUpCollection && (isOwner || isStaff) && (
              <>
                {isOwner && <Link href="/dashboard/payments" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Payments</Link>}
                <Link href="/dashboard/auctions" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Auctions</Link>
                <Link href="/dashboard/heatup/wishlists" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Wishlists</Link>
                <Link href="/dashboard/heatup/preorders" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Preorders</Link>
              </>
            )}

            {!isHeatUpStaff && (
              <>
                <Link href="/dashboard/settings/team" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Team</Link>
                <Link href="/dashboard/settings/company" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Settings</Link>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <CompanySwitcher tenants={tenants} activeTenantId={activeTenantId} />
            
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#475569', flexShrink: 0 }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
