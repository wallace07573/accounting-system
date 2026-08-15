import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Edit, Building2, User, Phone, MapPin, Receipt, Wallet, AlertCircle } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/utils'
import CustomerDetailClient from './CustomerDetailClient'

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value
  
  if (!activeTenantId) redirect('/dashboard')

  // Fetch Customer
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', activeTenantId)
    .single()

  if (custError || !customer) {
    redirect('/dashboard/customers')
  }

  // Fetch Documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*, items:document_items(amount)')
    .eq('customer_id', id)
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })

  // Fetch Transactions
  const { data: transactions } = await supabase
    .from('customer_transactions')
    .select('*')
    .eq('customer_id', id)
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false })

  // Fetch Auctions
  const { data: auctions } = await supabase
    .from('auction_records')
    .select('*')
    .eq('customer_id', id)
    .eq('tenant_id', activeTenantId)
    .order('date', { ascending: false })

  // Fetch other customers for Merge dropdown
  const { data: otherCustomers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('tenant_id', activeTenantId)
    .neq('id', id)
    .order('name', { ascending: true })

  let totalInvoiced = 0
  let totalPaid = 0
  let totalOutstanding = 0

  if (documents) {
    documents.forEach(doc => {
      if (doc.type === 'Invoice') {
        const docTotal = doc.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
        totalInvoiced += docTotal
        totalPaid += Number(doc.amount_paid || 0)
        if (doc.status !== 'Paid' && doc.status !== 'Void') {
          totalOutstanding += (docTotal - Number(doc.amount_paid || 0))
        }
      }
    })
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/dashboard/customers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none', backgroundColor: 'white' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            {customer.name}
          </h1>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Customer Profile & History
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Profile Details</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <User size={18} color="#94a3b8" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Name</div>
                <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 500 }}>{customer.name}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Building2 size={18} color="#94a3b8" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Company</div>
                <div style={{ fontSize: '15px', color: '#1e293b' }}>{customer.company_name || '-'}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Phone size={18} color="#94a3b8" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Contact / Attention</div>
                <div style={{ fontSize: '15px', color: '#1e293b' }}>{formatPhoneNumber(customer.attention)}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <MapPin size={18} color="#94a3b8" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Address</div>
                <div style={{ fontSize: '15px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{customer.address || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '20px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 600 }}>Total Invoiced</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                RM {totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '20px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#166534', fontWeight: 600 }}>Total Paid</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#14532d', marginTop: '2px' }}>
                RM {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '20px', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#5b21b6', fontWeight: 600 }}>CRM Balance</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#4c1d95', marginTop: '2px' }}>
                RM {Number(customer.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomerDetailClient customer={customer} documents={documents || []} transactions={transactions || []} otherCustomers={otherCustomers || []} auctions={auctions || []} />
    </div>
  )
}
