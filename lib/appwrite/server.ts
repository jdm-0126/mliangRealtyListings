import { Client, Databases } from 'node-appwrite'

export function getServerClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return new Databases(client)
}

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
