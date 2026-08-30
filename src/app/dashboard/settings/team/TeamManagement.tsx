'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Shield, User, Clock } from 'lucide-react'
import { useToast } from '@/components/Toast'

import { sendTeamInvite } from '@/app/actions/team'

export default function TeamManagement({
  tenantId,
  members,
  invites,
  currentUserId
}: {
  tenantId: string,
  members: any[],
  invites: any[],
  currentUserId: string
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    try {
      const result = await sendTeamInvite(email.trim(), role, tenantId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast(result.message, 'success')
      setEmail('')
      router.refresh()
    } catch (error: any) {
      toast('Error inviting user: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the company?')) return
    
    try {
      const { error } = await supabase
        .from('tenant_users')
        .delete()
        .match({ tenant_id: tenantId, user_id: userId })
        
      if (error) throw error
      router.refresh()
      toast('Member removed successfully', 'success')
    } catch (error: any) {
      toast('Error removing member: ' + error.message, 'error')
    }
  }

  const handleCancelInvite = async (email: string) => {
    try {
      const { error } = await supabase
        .from('tenant_invites')
        .delete()
        .match({ tenant_id: tenantId, email })
        
      if (error) throw error
      router.refresh()
      toast('Invite canceled successfully', 'success')
    } catch (error: any) {
      toast('Error canceling invite: ' + error.message, 'error')
    }
  }

  return (
    <div>
      <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
          Invite Team Member
        </h2>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 2 }}>
            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
              padding: '0 24px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>User</th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
              <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>
                        {member.email || `User ID: ${member.user_id.substring(0, 8)}...`}
                      </div>
                      {member.user_id === currentUserId && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>(You)</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: member.role === 'owner' ? '#eff6ff' : '#f1f5f9', color: member.role === 'owner' ? '#2563eb' : '#475569', borderRadius: '999px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>
                    {member.role === 'owner' && <Shield size={12} />}
                    {member.role}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  {member.user_id !== currentUserId && (
                    <button 
                      onClick={() => handleRemoveMember(member.user_id)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {invites.map((invite) => (
              <tr key={invite.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>
                        {invite.email}
                      </div>
                      <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>Pending Invite</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'inline-flex', padding: '4px 12px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '999px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>
                    {invite.role}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleCancelInvite(invite.email)}
                    style={{ color: '#64748b', background: 'none', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
