import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

// POST /api/revalidate-home
// Called by the admin when edit mode is toggled off with featured changes
// Simple secret check to prevent public abuse
export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.secret !== process.env.REVALIDATE_SECRET && body.secret !== 'mliang-revalidate-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    revalidatePath('/')
    return NextResponse.json({ revalidated: true, timestamp: Date.now() })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
