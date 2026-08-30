import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to dashboard immediately if a session exists
  if (session) {
    redirect('/dashboard/documents')
  }

  return <LoginForm />
}
