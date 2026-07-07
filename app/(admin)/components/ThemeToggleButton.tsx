'use client'
import { useAdminTheme } from './AdminThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggleButton() {
  const { theme, set } = useAdminTheme()

  const options: { value: 'light' | 'dark'; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ]

  return (
    <div className="flex gap-2">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => set(value)}
          aria-pressed={theme === value}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
          style={
            theme === value
              ? { background: 'hsl(var(--primary))', color: '#fff', borderColor: 'hsl(var(--primary))' }
              : { background: 'transparent', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
