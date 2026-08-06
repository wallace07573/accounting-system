'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { setActiveTenant } from '@/app/actions/tenant'
import { useToast } from '@/components/Toast'
import { Building2, Upload } from 'lucide-react'

export default function CompanySettingsForm({ 
  initialData, 
  userId,
  isSuperAdmin
}: { 
  initialData: any, 
  userId: string,
  isSuperAdmin?: boolean
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    bank_name: initialData?.bank_name || '',
    bank_account_number: initialData?.bank_account_number || '',
    bank_account_name: initialData?.bank_account_name || '',
    logo_url: initialData?.logo_url || '',
    ssm_number: initialData?.ssm_number || '',
    enable_heat_up_po: initialData?.enable_heat_up_po || false
  })
  
  const supabase = createClient()
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast('Logo file must be less than 2MB', 'error')
      return
    }

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
      
      setFormData(prev => ({ ...prev, logo_url: data.publicUrl }))
    } catch (error: any) {
      toast('Error uploading logo: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let shouldRedirect = false;

    try {
      if (initialData?.id) {
        // Update existing tenant
        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            bank_name: formData.bank_name,
            bank_account_number: formData.bank_account_number,
            bank_account_name: formData.bank_account_name,
            logo_url: formData.logo_url,
            ssm_number: formData.ssm_number,
            enable_heat_up_po: formData.enable_heat_up_po
          })
          .eq('id', initialData.id)

        if (updateError) throw updateError
        toast('Company profile updated successfully!', 'success')
        router.refresh()
      } else {
        // Create new tenant using RPC to bypass RLS select conflict
        const { data: newTenantId, error: insertError } = await supabase.rpc('create_tenant_with_owner', {
          new_name: formData.name,
          new_address: formData.address,
          new_phone: formData.phone,
          new_email: formData.email,
          new_bank_name: formData.bank_name,
          new_bank_account_number: formData.bank_account_number,
          new_bank_account_name: formData.bank_account_name,
          new_logo_url: formData.logo_url,
          new_ssm_number: formData.ssm_number
        })

        if (insertError) throw insertError

        toast('Company created successfully!', 'success')
        await setActiveTenant(newTenantId as string)
        shouldRedirect = true
      }
    } catch (error: any) {
      toast('Error saving company: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }

    if (shouldRedirect) {
      // Force a full hard reload so Next.js clears all layout caches 
      // and re-fetches the user's tenants for the top navigation bar.
      window.location.href = '/dashboard/documents'
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Logo Upload */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
          Company Logo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '12px', border: '1px dashed #cbd5e1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc',
            overflow: 'hidden'
          }}>
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Building2 size={24} color="#94a3b8" />
            )}
          </div>
          <div>
            <label style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <Upload size={16} />
              {loading ? 'Uploading...' : 'Upload Logo'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                disabled={loading}
                style={{ display: 'none' }} 
              />
            </label>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Recommended: Square or horizontal image, max 2MB.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Company Name *</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. Heat Up Collection"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. hello@heatup.com"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Company SSM</label>
          <input
            type="text"
            value={formData.ssm_number}
            onChange={(e) => setFormData({...formData, ssm_number: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. 003598023-H"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Phone Number</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. +60 12-345 6789"
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Company Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '80px' }}
          placeholder="Full business address for invoices"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Bank Name</label>
          <input
            type="text"
            value={formData.bank_name}
            onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. Maybank"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Account Number</label>
          <input
            type="text"
            value={formData.bank_account_number}
            onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. 5145 4323 7576"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Account Name</label>
          <input
            type="text"
            value={formData.bank_account_name}
            onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            placeholder="e.g. Heat Up Collection"
          />
        </div>
      </div>

        {/* Module Settings (Superadmin Only) */}
        {isSuperAdmin && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', marginTop: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Module Settings (Superadmin)
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="enable_heat_up_po"
                checked={formData.enable_heat_up_po}
                onChange={(e) => setFormData(prev => ({ ...prev, enable_heat_up_po: e.target.checked }))}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="enable_heat_up_po" style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                Enable Heat Up Collection PO Module
              </label>
            </div>
          </div>
        )}

        <div style={{ paddingTop: '24px', marginTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
            padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : initialData?.id ? 'Save Changes' : 'Create Company'}
        </button>
      </div>
    </form>
  )
}
