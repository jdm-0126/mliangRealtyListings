import AuthGuard from './components/AuthGuard'
import Navigation from '@/components/Navigation'
import ChatWidget from '@/components/ChatWidget'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="lg:pl-64">
          {children}
        </main>
        <ChatWidget />
      </div>
    </AuthGuard>
  )
}
