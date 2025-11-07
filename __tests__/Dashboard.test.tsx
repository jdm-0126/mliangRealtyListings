import React from 'react'
import { render, screen } from '@testing-library/react'
import Dashboard from '../app/components/Dashboard'

// Mock Supabase
jest.mock('../app/lib/supabaseClient.js', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null })
    })
  }
}))

// Mock React Data Table Component
jest.mock('react-data-table-component', () => {
  return function MockDataTable() {
    return <div>Mocked DataTable</div>
  }
})

describe('Dashboard', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders without crashing', () => {
    render(<Dashboard />)
    expect(screen.getByText('🏠 MLiang Realty')).toBeInTheDocument()
  })
})