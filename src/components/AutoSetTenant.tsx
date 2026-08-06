'use client'

import { useEffect } from 'react'
import { setActiveTenant } from '@/app/actions/tenant'
import { useRouter } from 'next/navigation'

export default function AutoSetTenant({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  
  useEffect(() => {
    setActiveTenant(tenantId).then(() => {
      router.refresh()
    })
  }, [tenantId, router])
  
  return null
}
