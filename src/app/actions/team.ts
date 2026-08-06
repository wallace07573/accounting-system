'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function sendTeamInvite(email: string, role: string, tenantId: string) {
  try {
    const serverClient = await createServerClient()
    
    // 1. Call the RPC to check permissions and register the invite
    const { data: rpcData, error: rpcError } = await serverClient.rpc('invite_user_by_email', {
      target_email: email,
      target_tenant_id: tenantId,
      target_role: role
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      return { error: rpcError.message }
    }

    if (rpcData?.status === 'error') {
      return { error: rpcData.message }
    }

    // 2. If status is 'pending', the user is new. We use the service role key to send a real email.
    if (rpcData?.status === 'pending') {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
      
      if (inviteError) {
        console.error('Admin Invite Error:', inviteError)
        return { error: 'Invite registered, but failed to send email: ' + inviteError.message }
      }

      return { success: true, message: 'Email invite sent successfully! They can click the link in their email to join.' }
    }

    return { success: true, message: rpcData?.message || 'Success' }
  } catch (error: any) {
    console.error('sendTeamInvite error:', error)
    return { error: error.message }
  }
}
