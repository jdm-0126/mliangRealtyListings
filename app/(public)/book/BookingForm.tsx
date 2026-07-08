'use client'
// app/(public)/book/BookingForm.tsx

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { validateContactNumber } from '@/lib/validation'
import { CalendarDays, Clock, Home, Building2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface BookingFormProps {
  contactNumber: string
}

type InterestType = 'listing' | 'project'
type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface ProjectOption {
  id: number
  name: string
  developer: string | null
  area: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

// Min date = today, max = 60 days out
function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 60)
  return d.toISOString().split('T')[0]
}

// ── Styles ───────────────────────────────────────────────────────────────────

const fieldBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--est-elevated)',
  border: '1px solid var(--est-border)',
  borderRadius: '0.625rem',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  color: 'var(--est-text)',
  outline: 'none',
}
const fieldErr: React.CSSProperties = { ...fieldBase, borderColor: '#ef4444' }
const label: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '0.375rem',
  color: 'var(--est-muted)',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BookingForm({ contactNumber }: BookingFormProps) {
  const [interestType, setInterestType] = useState<InterestType>('listing')
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [adminListings, setAdminListings] = useState<string[]>([])

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [propertyInterest, setPropertyInterest] = useState('')
  const [projectId, setProjectId] = useState<number | ''>('')
  const [message, setMessage] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Load projects from Supabase + admin-pinned listings from localStorage
  useEffect(() => {
    async function load() {
      // Admin-pinned listing names from settings
      try {
        const raw = localStorage.getItem('tenantSettings')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed.featuredBookingListings))
            setAdminListings(parsed.featuredBookingListings.filter(Boolean))
        }
      } catch { /* ignore */ }

      // Active projects from DB
      if (!supabase) return
      const { data } = await supabase
        .from('projects')
        .select('id, name, developer, area')
        .eq('status', 'Active')
        .order('name')
      if (data) setProjects(data as ProjectOption[])
    }
    load()
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required.'
    if (!phone.trim()) e.phone = 'Contact number is required.'
    else if (!validateContactNumber(phone.trim())) e.phone = 'Enter a valid PH mobile number (09XXXXXXXXX).'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.'
    if (!date) e.date = 'Please pick a date.'
    if (!timeSlot) e.timeSlot = 'Please pick a time slot.'
    if (interestType === 'project' && !projectId) e.projectId = 'Please select a project.'
    if (interestType === 'listing' && !propertyInterest.trim()) e.propertyInterest = 'Please enter the property you want to view.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStatus('loading'); setErrors({}); setErrorMsg('')

    try {
      if (!supabase) throw new Error('Supabase not initialised.')
      const { error } = await supabase.from('bookings').insert([{
        full_name: fullName.trim(),
        contact_number: phone.trim(),
        email: email.trim(),
        preferred_date: date,
        preferred_time: timeSlot,
        interest_type: interestType,
        property_interest: interestType === 'listing' ? propertyInterest.trim() : null,
        project_id: interestType === 'project' && projectId ? Number(projectId) : null,
        message: message.trim() || null,
      }])
      if (error) throw error
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg(`Booking failed. Please try again or call us at ${contactNumber}.`)
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--est-elevated)', border: '1px solid #18A96A33' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#18A96A22' }}>
          <svg className="w-7 h-7" style={{ color: '#18A96A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>Booking Received!</p>
        <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
          We'll confirm your viewing on <strong>{date}</strong> at <strong>{timeSlot}</strong> within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {status === 'error' && errorMsg && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#ef444418', border: '1px solid #ef444444', color: '#fca5a5' }}>
          {errorMsg}
        </div>
      )}

      {/* ── Interest type toggle ── */}
      <div>
        <p style={label}>I'm interested in</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'listing', icon: Home,      label: 'A Specific Property' },
            { value: 'project', icon: Building2, label: 'A Developer Project' },
          ] as const).map(({ value, icon: Icon, label: lbl }) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterestType(value)}
              className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all"
              style={{
                background: interestType === value ? 'var(--est-purple)' : 'var(--est-elevated)',
                border: `1px solid ${interestType === value ? 'var(--est-purple)' : 'var(--est-border)'}`,
                color: interestType === value ? '#fff' : 'var(--est-subtle)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Property / Project selector ── */}
      {interestType === 'listing' ? (
        <div>
          <label style={label}>
            <Home className="inline w-3 h-3 mr-1" />
            Property of Interest <span style={{ color: 'var(--est-purple)' }}>*</span>
          </label>
          {adminListings.length > 0 ? (
            <select
              value={propertyInterest}
              onChange={e => setPropertyInterest(e.target.value)}
              style={errors.propertyInterest ? fieldErr : fieldBase}
            >
              <option value="">— Select a property —</option>
              {adminListings.map(l => <option key={l} value={l}>{l}</option>)}
              <option value="__other__">Other (type below)</option>
            </select>
          ) : null}
          {(adminListings.length === 0 || propertyInterest === '__other__') && (
            <input
              type="text"
              value={propertyInterest === '__other__' ? '' : propertyInterest}
              onChange={e => setPropertyInterest(e.target.value)}
              placeholder="Enter address or property description"
              style={{ ...(errors.propertyInterest ? fieldErr : fieldBase), marginTop: adminListings.length > 0 ? '0.5rem' : 0 }}
            />
          )}
          {errors.propertyInterest && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.propertyInterest}</p>}
        </div>
      ) : (
        <div>
          <label style={label}>
            <Building2 className="inline w-3 h-3 mr-1" />
            Developer Project <span style={{ color: 'var(--est-purple)' }}>*</span>
          </label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
            style={errors.projectId ? fieldErr : fieldBase}
          >
            <option value="">— Select a project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.developer ? ` · ${p.developer}` : ''}{p.area ? ` (${p.area})` : ''}
              </option>
            ))}
          </select>
          {errors.projectId && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.projectId}</p>}
          {projects.length === 0 && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--est-muted)' }}>No projects available yet. Check back soon.</p>
          )}
        </div>
      )}

      {/* ── Date + Time ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label style={label}>
            <CalendarDays className="inline w-3 h-3 mr-1" />
            Preferred Date <span style={{ color: 'var(--est-purple)' }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            min={todayStr()}
            max={maxDateStr()}
            onChange={e => setDate(e.target.value)}
            style={errors.date ? fieldErr : fieldBase}
          />
          {errors.date && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.date}</p>}
        </div>
        <div>
          <label style={label}>
            <Clock className="inline w-3 h-3 mr-1" />
            Preferred Time <span style={{ color: 'var(--est-purple)' }}>*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeSlot(slot)}
                className="py-2 px-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: timeSlot === slot ? 'var(--est-purple)' : 'var(--est-elevated)',
                  border: `1px solid ${timeSlot === slot ? 'var(--est-purple)' : 'var(--est-border)'}`,
                  color: timeSlot === slot ? '#fff' : 'var(--est-subtle)',
                }}
              >
                {slot}
              </button>
            ))}
          </div>
          {errors.timeSlot && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.timeSlot}</p>}
        </div>
      </div>

      {/* ── Contact details ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label style={label}>Full Name <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            maxLength={100} placeholder="Juan Dela Cruz"
            style={errors.fullName ? fieldErr : fieldBase} />
          {errors.fullName && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.fullName}</p>}
        </div>
        <div>
          <label style={label}>Contact Number <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            maxLength={11} placeholder="09XXXXXXXXX"
            style={errors.phone ? fieldErr : fieldBase} />
          {errors.phone && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label style={label}>Email Address <span style={{ color: 'var(--est-purple)' }}>*</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          maxLength={150} placeholder="you@example.com"
          style={errors.email ? fieldErr : fieldBase} />
        {errors.email && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>}
      </div>

      {/* ── Optional message ── */}
      <div>
        <label style={label}>Additional Notes <span style={{ color: 'var(--est-border)' }}>(optional)</span></label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          rows={3} maxLength={1000}
          placeholder="Any specific questions or requests…"
          style={{ ...fieldBase, resize: 'vertical' }} />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--est-purple)', color: '#fff' }}
      >
        {status === 'loading' ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : 'Confirm Booking'}
      </button>
    </form>
  )
}
