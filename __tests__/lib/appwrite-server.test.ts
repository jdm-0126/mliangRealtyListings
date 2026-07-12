jest.mock('node-appwrite', () => {
  class Client {
    public endpoint?: string
    public project?: string
    public key?: string

    setEndpoint(value: string) {
      this.endpoint = value
      return this
    }

    setProject(value: string) {
      this.project = value
      return this
    }

    setKey(value: string) {
      this.key = value
      return this
    }
  }

  class Databases {
    public client: Client

    constructor(client: Client) {
      this.client = client
    }
  }

  return { Client, Databases }
})

describe('Appwrite server client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://example.com/v1'
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'project-id'
    delete process.env.APPWRITE_API_KEY
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('does not require an API key when the project is configured', () => {
    const { getServerClient } = require('../../lib/appwrite/server')
    const client = getServerClient()

    expect(client).toBeDefined()
  })
})
