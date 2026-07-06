'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { validateContactNumber } from '@/lib/validation'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (values.fullName.trim().length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer.'
  }

  if (!values.contactNumber.trim()) {
    errors.contactNumber = 'Contact number is required.'
  } else if (!validateContactNumber(values.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX).'
  }

  if (!values.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  } else if (values.email.trim().length > 150) {
    errors.email = 'Email must be 150 characters or fewer.'
  }

  if (values.propertyOfInterest && values.propertyOfInterest.length > 200) {
    errors.propertyOfInterest = 'Property of interest must be 200 characters or fewer.'
  }

  if (!values.message.trim()) {
    errors.message = 'Message is required.'
  } else if (values.message.trim().length > 1000) {
    errors.message = 'Message must be 1000 characters or fewer.'
  }

  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InquiryForm({
  initialPropertyOfInterest = '',
  contactNumber,
}: InquiryFormProps) {
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    contactNumber: '',
    email: '',
    propertyOfInterest: initialPropertyOfInterest,
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear inline error for this field as the user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Step 1 — validate; show inline errors and bail if invalid
    const newErrors = validateForm(values)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Step 2 — loading state
    setStatus('loading')
    setErrors({})
    setErrorMsg('')

    // Step 3 — insert into Supabase leads table
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialised.')
      }

      const { error } = await supabase.from('leads').insert([
        {
          full_name: values.fullName.trim(),
          contact_number: values.contactNumber.trim(),
          email: values.email.trim(),
          property_of_interest: values.propertyOfInterest.trim() || null,
          message: values.message.trim(),
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      // Step 4a — success
      setStatus('success')
      setValues({
        fullName: '',
        contactNumber: '',
        email: '',
        propertyOfInterest: '',
        message: '',
      })
    } catch {
      // Step 4b — error
      setStatus('error')
      setErrorMsg(
        `Submission failed. Please try again or call us directly at ${contactNumber}.`
      )
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div
        role="alert"
        className="rounded-lg bg-green-50 border border-green-200 p-6 text-center"
      >
        <p className="text-green-800 text-lg font-medium">
          Thank you! We will contact you shortly.
        </p>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error banner */}
      {status === 'error' && errorMsg && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm"
        >
          {errorMsg}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={values.fullName}
          onChange={handleChange}
          maxLength={100}
          autoComplete="name"
          aria-required="true"
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          aria-invalid={errors.fullName ? 'true' : undefined}
          disabled={status === 'loading'}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Contact Number */}
      <div>
        <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Number <span aria-hidden="true">*</span>
        </label>
        <input
          id="contactNumber"
          name="contactNumber"
          type="tel"
          value={values.contactNumber}
          onChange={handleChange}
          maxLength={11}
          autoComplete="tel"
          placeholder="09XXXXXXXXX"
          aria-required="true"
          aria-describedby={errors.contactNumber ? 'contactNumber-error' : undefined}
          aria-invalid={errors.contactNumber ? 'true' : undefined}
          disabled={status === 'loading'}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            errors.contactNumber ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.contactNumber && (
          <p id="contactNumber-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.contactNumber}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          maxLength={150}
          autoComplete="email"
          aria-required="true"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={errors.email ? 'true' : undefined}
          disabled={status === 'loading'}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Property of Interest (optional) */}
      <div>
        <label htmlFor="propertyOfInterest" className="block text-sm font-medium text-gray-700 mb-1">
          Property of Interest <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="propertyOfInterest"
          name="propertyOfInterest"
          type="text"
          value={values.propertyOfInterest}
          onChange={handleChange}
          maxLength={200}
          aria-describedby={errors.propertyOfInterest ? 'propertyOfInterest-error' : undefined}
          aria-invalid={errors.propertyOfInterest ? 'true' : undefined}
          disabled={status === 'loading'}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            errors.propertyOfInterest ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.propertyOfInterest && (
          <p id="propertyOfInterest-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.propertyOfInterest}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          maxLength={1000}
          aria-required="true"
          aria-describedby={errors.message ? 'message-error' : undefined}
          aria-invalid={errors.message ? 'true' : undefined}
          disabled={status === 'loading'}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-y ${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.message && (
          <p id="message-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? (
          <>
            {/* Spinner */}
            <svg
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Sending…
          </>
        ) : (
          'Send Inquiry'
        )}
      </button>
    </form>
  )
}
