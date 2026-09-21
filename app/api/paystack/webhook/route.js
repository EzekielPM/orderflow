import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { recordSuccessfulPayment } from '../../../../lib/payments'

export const runtime = 'nodejs'

export async function POST(request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json(
      { message: 'Webhook is not configured.' },
      { status: 503 }
    )
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  const expected = createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex')

  const validSignature =
    signature.length === expected.length &&
    timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )

  if (!validSignature) {
    return NextResponse.json(
      { message: 'Invalid signature.' },
      { status: 401 }
    )
  }

  let event

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { message: 'Invalid payload.' },
      { status: 400 }
    )
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  try {
    await recordSuccessfulPayment(event.data)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Paystack webhook processing failed:', error)

    return NextResponse.json(
      { message: 'Payment could not be recorded.' },
      { status: 500 }
    )
  }
}
