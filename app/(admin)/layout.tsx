import AdminThemeProvider from './components/AdminThemeProvider'
import Navigation from '@/components/Navigation'
import ChatWidget from '@/components/ChatWidget'


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <AdminThemeProvider>
      {children}
      
    </AdminThemeProvider>
  )
}
