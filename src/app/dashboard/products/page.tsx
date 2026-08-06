import { getProducts } from '@/app/actions/product'
import ProductsClient from './ProductsClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  if (!activeTenantId) {
    redirect('/dashboard/settings/company')
  }

  const initialProducts = await getProducts(activeTenantId)

  return (
    <div className="max-w-6xl mx-auto">
      <ProductsClient initialProducts={initialProducts} activeTenantId={activeTenantId} />
    </div>
  )
}
