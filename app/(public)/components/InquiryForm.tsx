'use client'
// app/(public)/components/InquiryForm.tsx — Estatein dark theme

import { useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { validateContactNumber } from '@/lib/validation'

interface InquiryFormProps {
  initialPropertyOfInterest?: string
  contactNumber: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormValues {
  fullName: string
  contactNumber: string
  email: string
  propertyOfInterest: string
  message: string
}

interface FormErrors {
  fullName?: string
  contactNumber?: string
  email?: string
  propertyOfInterest?: string
  message?: string
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'Full name is required.'
  else if (values.fullName.trim().length > 100) errors.fullName = 'Full name must be 100 characters or fewer.'
  if (!values.contactNumber.trim()) errors.contactNumber = 'Contact number is required.'
  else if (!validateContactNumber(values.contactNumber.trim())) errors.contactNumber = 'Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX).'
  if (!values.email.trim()) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  else if (values.email.trim().length > 150) errors.email = 'Email must be 150 characters or fewer.'
  if (values.propertyOfInterest && values.propertyOfInterest.length > 200) errors.propertyOfInterest = 'Property of interest must be 200 characters or fewer.'
  if (!values.message.trim()) errors.message = 'Message is required.'
  else if (values.message.trim().length > 1000) errors.message = 'Message must be 1,000 characters or fewer.'
  return errors
}

// Shared field style helpers
const fieldBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--est-elevated)',
  border: '1px solid var(--est-border)',
  borderRadius: '0.625rem',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  color: 'var(--est-text)',
  outline: 'none',
  transition: 'border-color 150ms',
}
const fieldError: React.CSSProperties = { ...fieldBase, borderColor: '#ef4444' }
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '0.375rem',
  color: 'var(--est-muted)',
}

export default function InquiryForm({ initialPropertyOfInterest = '', contactNumber }: InquiryFormProps) {
  const [values, setValues] = useState<FormValues>({
    fullName: '', contactNumber: '', email: '',
    propertyOfInterest: initialPropertyOfInterest, message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors = validateForm(values)
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setStatus('loading'); setErrors({}); setErrorMsg('')
    try {
      if (!supabase) throw new Error('Supabase client is not initialised.')
      const { error } = await supabase.from('leads').insert([{
        full_name: values.fullName.trim(), contact_number: values.contactNumber.trim(),
        email: values.email.trim(), property_of_interest: values.propertyOfInterest.trim() || null,
        message: values.message.trim(), created_at: new Date().toISOString(),
      }])
      if (error) throw error
      setStatus('success')
      setValues({ fullName: '', contactNumber: '', email: '', propertyOfInterest: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMsg(`Submission failed. Please try again or call us directly at ${contactNumber}.`)
    }
  }

  if (status === 'success') {
    return (
      <div
        role="alert"
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--est-elevated)', border: '1px solid #18A96A33' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#18A96A22' }}>
          <svg className="w-6 h-6" style={{ color: 'var(--est-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--est-text)' }}>Thank you! We will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error banner */}
      {status === 'error' && errorMsg && (
        <div
          role="alert"
          className="rounded-xl p-4 text-sm"
          style={{ background: '#ef444418', border: '1px solid #ef444444', color: '#fca5a5' }}
        >
          {errorMsg}
        </div>
      )}

      {/* Row: Name + Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fullName" style={labelStyle}>Full Name <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input
            id="fullName" name="fullName" type="text"
            value={values.fullName} onChange={handleChange}
            maxLength={100} autoComplete="name"
            aria-required="true"
            aria-invalid={errors.fullName ? 'true' : undefined}
            disabled={status === 'loading'}
            placeholder="e.g. Juan Dela Cruz"
            style={errors.fullName ? fieldError : fieldBase}
          />
          {errors.fullName && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="contactNumber" style={labelStyle}>Contact Number <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input
            id="contactNumber" name="contactNumber" type="tel"
            value={values.contactNumber} onChange={handleChange}
            maxLength={11} autoComplete="tel" placeholder="09XXXXXXXXX"
            aria-required="true"
            aria-invalid={errors.contactNumber ? 'true' : undefined}
            disabled={status === 'loading'}
            style={errors.contactNumber ? fieldError : fieldBase}
          />
          {errors.contactNumber && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.contactNumber}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" style={labelStyle}>Email Address <span style={{ color: 'var(--est-purple)' }}>*</span></label>
        <input
          id="email" name="email" type="email"
          value={values.email} onChange={handleChange}
          maxLength={150} autoComplete="email"
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          disabled={status === 'loading'}
          placeholder="you@example.com"
          style={errors.email ? fieldError : fieldBase}
        />
        {errors.email && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>}
      </div>

      {/* Property of interest */}
      <div>
        <label htmlFor="propertyOfInterest" style={labelStyle}>
          Property of Interest <span style={{ color: 'var(--est-border)' }}>(optional)</span>
        </label>
        <input
          id="propertyOfInterest" name="propertyOfInterest" type="text"
          value={values.propertyOfInterest} onChange={handleChange}
          maxLength={200}
          aria-invalid={errors.propertyOfInterest ? 'true' : undefined}
          disabled={status === 'loading'}
          placeholder="Address or property type"
          style={errors.propertyOfInterest ? fieldError : fieldBase}
        />
        {errors.propertyOfInterest && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.propertyOfInterest}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" style={labelStyle}>Message <span style={{ color: 'var(--est-purple)' }}>*</span></label>
        <textarea
          id="message" name="message" rows={5}
          value={values.message} onChange={handleChange}
          maxLength={1000}
          aria-required="true"
          aria-invalid={errors.message ? 'true' : undefined}
          disabled={status === 'loading'}
          placeholder="Tell us what you're looking for…"
          style={{ ...( errors.message ? fieldError : fieldBase), resize: 'vertical' }}
        />
        {errors.message && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--est-purple)', color: '#fff' }}
      >
        {status === 'loading' ? (
          <>
            <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Sending…
          </>
        ) : 'Send Inquiry'}
      </button>
    </form>
  )
}
