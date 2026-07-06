'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminFAQPanel from '../../../../components/AdminFAQPanel'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const userEmail = sessionStorage.getItem('userEmail')
    
    if (auth !== 'authenticated' || userEmail !== SUPERADMIN_EMAIL) {
      router.push('/broker-dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <AdminFAQPanel />
    </div>
  )
}