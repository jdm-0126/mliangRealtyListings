import AuthGuard from './components/AuthGuard'
import AdminThemeProvider from './components/AdminThemeProvider'
import Navigation from '@/components/Navigation'
import ChatWidget from '@/components/ChatWidget'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminThemeProvider>
        <div className="min-h-screen" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
          <Navigation />
          <main className="lg:pl-64">
            {children}
          </main>
          <ChatWidget />
        </div>
      </AdminThemeProvider>
    </AuthGuard>
  )
}
