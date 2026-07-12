import { Client, Databases } from 'node-appwrite'

function getRequiredEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

export function getServerClient() {
  const endpoint = getRequiredEnv('NEXT_PUBLIC_APPWRITE_ENDPOINT')
  const projectId = getRequiredEnv('NEXT_PUBLIC_APPWRITE_PROJECT_ID')

  const client = new Client()

  if (endpoint) client.setEndpoint(endpoint)
  if (projectId) client.setProject(projectId)

  const apiKey = getRequiredEnv('APPWRITE_API_KEY')
  if (apiKey) client.setKey(apiKey)

  return new Databases(client)
}

export const DATABASE_ID = getRequiredEnv('NEXT_PUBLIC_APPWRITE_DATABASE_ID') || ''
