import { databases, DATABASE_ID } from '@/lib/appwrite/client'

const DEFAULT_TENANT_ID = '81b78be3-db0c-41f3-8f6f-e3989114eacf'
const LISTINGS_COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

export async function getTenantScopedClient() {
  return {
    databases,
    databaseId: DATABASE_ID,
    tenantId: DEFAULT_TENANT_ID,
    listingsCollection: LISTINGS_COL,
  }
}
