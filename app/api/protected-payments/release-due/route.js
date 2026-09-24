import { NextResponse } from 'next/server'
import { protectionClient } from '../../../../lib/protection-server'

export async function GET(request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !==
      `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { message: 'Unauthorised' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await protectionClient().rpc(
      'release_due_protected_test'
    )

    if (error) throw error

    return NextResponse.json({ released: data })
  } catch {
    return NextResponse.json(
      { message: 'Test release job failed' },
      { status: 500 }
    )
  }
}
