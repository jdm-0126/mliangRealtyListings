'use client'
// app/(public)/components/SellerForm.tsx
// Form for property owners who want to list / sell / rent through M. Liang Realty.
// Submitted records go to the 'leads' table with a 'seller' message prefix.

import { useState } from 'react'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { ID } from 'appwrite'
import { validateContactNumber } from '@/lib/validation'

const LEADS_COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LEADS!

interface SellerFormProps {
  contactNumber: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

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

interface Values {
  fullName: string
  contactNumber: string
  email: string
  propertyAddress: string
  propertyType: string
  listingIntent: string
  askingPrice: string
  details: string
}

interface Errors {
  fullName?: string
  contactNumber?: string
  email?: string
  propertyAddress?: string
  details?: string
}

function validate(v: Values): Errors {
  const e: Errors = {}
  if (!v.fullName.trim()) e.fullName = 'Full name is required.'
  if (!v.contactNumber.trim()) e.contactNumber = 'Contact number is required.'
  else if (!validateContactNumber(v.contactNumber.trim())) e.contactNumber = 'Enter a valid Philippine mobile number.'
  if (!v.email.trim()) e.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
  if (!v.propertyAddress.trim()) e.propertyAddress = 'Property address or description is required.'
  return e
}

export default function SellerForm({ contactNumber }: SellerFormProps) {
  const [values, setValues] = useState<Values>({
    fullName: '', contactNumber: '', email: '',
    propertyAddress: '', propertyType: 'House and Lot',
    listingIntent: 'For Sale', askingPrice: '', details: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof Errors]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStatus('loading'); setErrors({}); setErrorMsg('')

    const message = [
      `[SELLER INQUIRY]`,
      `Property: ${values.propertyAddress}`,
      `Type: ${values.propertyType}`,
      `Intent: ${values.listingIntent}`,
      values.askingPrice ? `Asking Price: ${values.askingPrice}` : '',
      values.details ? `Details: ${values.details}` : '',
    ].filter(Boolean).join('\n')

    try {
      await databases.createDocument(DATABASE_ID, LEADS_COL, ID.unique(), {
        full_name: values.fullName.trim(),
        contact_number: values.contactNumber.trim(),
        email: values.email.trim(),
        property_of_interest: values.propertyAddress.trim(),
        message,
        status: 'new',
      })
      setStatus('success')
      setValues({ fullName: '', contactNumber: '', email: '', propertyAddress: '', propertyType: 'House and Lot', listingIntent: 'For Sale', askingPrice: '', details: '' })
    } catch {
      setStatus('error')
      setErrorMsg(`Submission failed. Please call us at ${contactNumber}.`)
    }
  }

  if (status === 'success') {
    return (
      <div role="alert" className="rounded-xl p-6 text-center" style={{ background: 'var(--est-elevated)', border: '1px solid #18A96A33' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#18A96A22' }}>
          <svg className="w-6 h-6" style={{ color: 'var(--est-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--est-text)' }}>Thank you! We'll be in touch to discuss your property.</p>
      </div>
    )
  }

  const selectStyle: React.CSSProperties = { ...fieldBase, cursor: 'pointer' }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status === 'error' && errorMsg && (
        <div role="alert" className="rounded-xl p-4 text-sm" style={{ background: '#ef444418', border: '1px solid #ef444444', color: '#fca5a5' }}>
          {errorMsg}
        </div>
      )}

      {/* Name + Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="s-fullName" style={labelStyle}>Full Name <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input id="s-fullName" name="fullName" type="text" value={values.fullName} onChange={handleChange}
            maxLength={100} autoComplete="name" placeholder="e.g. Juan Dela Cruz"
            style={errors.fullName ? fieldError : fieldBase} disabled={status === 'loading'} />
          {errors.fullName && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="s-contactNumber" style={labelStyle}>Contact Number <span style={{ color: 'var(--est-purple)' }}>*</span></label>
          <input id="s-contactNumber" name="contactNumber" type="tel" value={values.contactNumber} onChange={handleChange}
            maxLength={11} placeholder="09XXXXXXXXX" autoComplete="tel"
            style={errors.contactNumber ? fieldError : fieldBase} disabled={status === 'loading'} />
          {errors.contactNumber && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.contactNumber}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="s-email" style={labelStyle}>Email Address <span style={{ color: 'var(--est-purple)' }}>*</span></label>
        <input id="s-email" name="email" type="email" value={values.email} onChange={handleChange}
          maxLength={150} autoComplete="email" placeholder="you@example.com"
          style={errors.email ? fieldError : fieldBase} disabled={status === 'loading'} />
        {errors.email && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>}
      </div>

      {/* Property address */}
      <div>
        <label htmlFor="s-propertyAddress" style={labelStyle}>Property Address / Description <span style={{ color: 'var(--est-purple)' }}>*</span></label>
        <input id="s-propertyAddress" name="propertyAddress" type="text" value={values.propertyAddress} onChange={handleChange}
          maxLength={300} placeholder="e.g. Lot 12, Brgy. Dolores, San Fernando, Pampanga"
          style={errors.propertyAddress ? fieldError : fieldBase} disabled={status === 'loading'} />
        {errors.propertyAddress && <p role="alert" className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.propertyAddress}</p>}
      </div>

      {/* Type + Intent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="s-propertyType" style={labelStyle}>Property Type</label>
          <select id="s-propertyType" name="propertyType" value={values.propertyType} onChange={handleChange} style={selectStyle} disabled={status === 'loading'}>
            <option>House and Lot</option>
            <option>Lot Only</option>
            <option>Commercial</option>
            <option>Condominium</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="s-listingIntent" style={labelStyle}>I want to</label>
          <select id="s-listingIntent" name="listingIntent" value={values.listingIntent} onChange={handleChange} style={selectStyle} disabled={status === 'loading'}>
            <option value="For Sale">Sell this property</option>
            <option value="For Rent">Rent out this property</option>
            <option value="Both">Sell or Rent (open to offers)</option>
          </select>
        </div>
      </div>

      {/* Asking price */}
      <div>
        <label htmlFor="s-askingPrice" style={labelStyle}>Asking Price <span style={{ color: 'var(--est-border)' }}>(optional)</span></label>
        <input id="s-askingPrice" name="askingPrice" type="text" value={values.askingPrice} onChange={handleChange}
          maxLength={50} placeholder="e.g. ₱2,500,000 or negotiable"
          style={fieldBase} disabled={status === 'loading'} />
      </div>

      {/* Additional details */}
      <div>
        <label htmlFor="s-details" style={labelStyle}>Additional Details <span style={{ color: 'var(--est-border)' }}>(optional)</span></label>
        <textarea id="s-details" name="details" rows={4} value={values.details} onChange={handleChange}
          maxLength={1000} placeholder="Lot area, floor area, number of bedrooms, special features, reason for selling…"
          style={{ ...(fieldBase), resize: 'vertical' }} disabled={status === 'loading'} />
      </div>

      <button type="submit" disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--est-purple)', color: '#fff' }}>
        {status === 'loading' ? (
          <>
            <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Sending…
          </>
        ) : 'Submit Property for Listing'}
      </button>
    </form>
  )
}
