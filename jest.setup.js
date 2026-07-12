import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () {}

// jsdom does not implement IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not expose TextEncoder/TextDecoder (needed by node-appwrite via undici)
const { TextEncoder, TextDecoder, ReadableStream } = require('stream/web')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

// Mock Appwrite client so tests that import components using it don't throw
jest.mock('@/lib/appwrite/client', () => ({
  databases: {
    createDocument: jest.fn().mockResolvedValue({}),
    listDocuments: jest.fn().mockResolvedValue({ documents: [] }),
  },
  DATABASE_ID: 'test-db',
}))

// Mock Appwrite server so tests that import server-side modules don't load node-appwrite/undici
jest.mock('@/lib/appwrite/server', () => ({
  getServerClient: () => ({
    listDocuments: jest.fn().mockResolvedValue({ documents: [] }),
  }),
  DATABASE_ID: 'test-db',
}))
