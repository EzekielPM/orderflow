import { NextResponse } from 'next/server'
import {
  protectionClient,
  protectionUser,
  isProtectionAdmin,
} from '../../../lib/protection-server'

const json = (value, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })

export async function GET(request) {
  try {
    const db = protectionClient()
    const user = await protectionUser(request, db)
    const admin = isProtectionAdmin(user)

    let query = db
      .from('protected_payments_test')
      .select('*,orders(public_token)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!admin) {
      query = query.or(
        `buyer_id.eq.${user.id},merchant_id.eq.${user.id}`
      )
    }

    const { data, error } = await query
    if (error) throw error

    return json({
      records: data,
      userId: user.id,
      admin,
    })
  } catch (error) {
    return json({ message: error.message }, 400)
  }
}

export async function POST(request) {
  try {
    const db = protectionClient()
    const user = await protectionUser(request, db)
    const { id, action, reason = '' } = await request.json()

    if (typeof id !== 'string' || typeof reason !== 'string') {
      return json({ message: 'Invalid request.' }, 400)
    }

    const allowedActions = [
      'delivery',
      'confirm',
      'dispute',
      'refund',
      'release',
    ]

    if (!allowedActions.includes(action)) {
      throw new Error('Invalid action')
    }

    if (
      ['refund', 'release'].includes(action) &&
      !isProtectionAdmin(user)
    ) {
      return json({ message: 'Admin permission required' }, 403)
    }

    const { data, error } = await db.rpc('protected_test_action', {
      p_id: id,
      p_actor: user.id,
      p_action: action,
      p_reason: reason,
    })

    if (error) throw error

    return json({ record: data })
  } catch (error) {
    return json({ message: error.message }, 400)
  }
}
