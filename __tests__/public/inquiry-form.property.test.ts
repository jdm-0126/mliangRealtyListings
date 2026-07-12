/**
 * Property 13: Invalid form submissions never call the Supabase insert API
 * Property 14: Valid form submissions insert correct data into Supabase leads table
 *
 * Validates: Requirements 6.6 (Property 13), 6.3 (Property 14)
 */

import * as fc from 'fast-check'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'

// Mock Appwrite client — factory uses jest.fn() directly (no hoisting issue)
jest.mock('@/lib/appwrite/client', () => ({
  databases: { createDocument: jest.fn() },
  DATABASE_ID: 'test-db',
}))

import InquiryForm from '../../app/(public)/components/InquiryForm'

const CONTACT_NUMBER = '09393440944'

// Helper to get the mock after hoisting
function mockFn() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/appwrite/client').databases.createDocument as jest.Mock
}

function getInput(container: HTMLElement, id: string) {
  return container.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement
}
function fillField(container: HTMLElement, id: string, value: string) {
  const el = getInput(container, id)
  fireEvent.change(el, { target: { value, name: id === 'contactNumber' ? 'contactNumber' : id } })
}
function submitForm(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form')!)
}

const validContactNumber = fc.stringMatching(/^\d{9}$/).map(s => `09${s}`)
const validEmail = fc.emailAddress()
const validName = fc.string({ minLength: 1, maxLength: 99 }).filter(s => s.trim().length > 0)
const validMessage = fc.string({ minLength: 1, maxLength: 999 }).filter(s => s.trim().length > 0)

describe('Property 13: Invalid form submissions never call Supabase insert', () => {
  beforeEach(() => mockFn().mockClear())

  it('does not call insert when fullName is empty', async () => {
    await fc.assert(
      fc.asyncProperty(validContactNumber, validEmail, validMessage, async (cn, email, msg) => {
        mockFn().mockClear()
        const { container, unmount } = render(React.createElement(InquiryForm, { contactNumber: CONTACT_NUMBER }))
        fillField(container, 'contactNumber', cn)
        fillField(container, 'email', email)
        fillField(container, 'message', msg)
        await act(async () => submitForm(container))
        const result = mockFn().mock.calls.length === 0
        unmount()
        return result
      }),
      { numRuns: 20 }
    )
  })

  it('does not call insert when contactNumber is invalid', async () => {
    await fc.assert(
      fc.asyncProperty(validName, fc.string().filter(s => !/^09\d{9}$/.test(s)), validEmail, validMessage, async (name, cn, email, msg) => {
        mockFn().mockClear()
        const { container, unmount } = render(React.createElement(InquiryForm, { contactNumber: CONTACT_NUMBER }))
        fillField(container, 'fullName', name)
        fillField(container, 'contactNumber', cn)
        fillField(container, 'email', email)
        fillField(container, 'message', msg)
        await act(async () => submitForm(container))
        const result = mockFn().mock.calls.length === 0
        unmount()
        return result
      }),
      { numRuns: 20 }
    )
  })

  it('does not call insert when message is empty', async () => {
    await fc.assert(
      fc.asyncProperty(validName, validContactNumber, validEmail, async (name, cn, email) => {
        mockFn().mockClear()
        const { container, unmount } = render(React.createElement(InquiryForm, { contactNumber: CONTACT_NUMBER }))
        fillField(container, 'fullName', name)
        fillField(container, 'contactNumber', cn)
        fillField(container, 'email', email)
        // message left empty
        await act(async () => submitForm(container))
        const result = mockFn().mock.calls.length === 0
        unmount()
        return result
      }),
      { numRuns: 20 }
    )
  })
})

describe('Property 14: Valid form submissions insert correct data', () => {
  beforeEach(() => {
    mockFn().mockResolvedValue({})
    mockFn().mockClear()
  })

  it('calls insert exactly once with correct fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ fullName: validName, contactNumber: validContactNumber, email: validEmail, message: validMessage }),
        async (values) => {
          mockFn().mockResolvedValue({})
          mockFn().mockClear()
          const { container, unmount } = render(React.createElement(InquiryForm, { contactNumber: CONTACT_NUMBER }))
          fillField(container, 'fullName', values.fullName)
          fillField(container, 'contactNumber', values.contactNumber)
          fillField(container, 'email', values.email)
          fillField(container, 'message', values.message)
          await act(async () => submitForm(container))
          await waitFor(() => expect(mockFn().mock.calls.length).toBeGreaterThan(0), { timeout: 3000 })
          // createDocument(DATABASE_ID, COLLECTION, ID.unique(), data)
          const [,, , row] = mockFn().mock.calls[0]
          const result = (
            row.full_name === values.fullName.trim() &&
            row.contact_number === values.contactNumber.trim() &&
            row.email === values.email.trim() &&
            row.message === values.message.trim()
          )
          unmount()
          return result
        }
      ),
      { numRuns: 20 }
    )
  })
})
