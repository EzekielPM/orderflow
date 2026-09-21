import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { message: 'Paystack test key has not been added yet.' },
        { status: 503 }
      )
    }

    const {
      email,
      amount,
      orderId,
      paymentMethod = 'paystack',
    } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'A buyer email address is required for payment.' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { message: 'Enter a valid payment amount.' },
        { status: 400 }
      )
    }

    const payload = {
      email,
      amount: Math.round(Number(amount) * 100),
      currency: 'NGN',
      callback_url: `${new URL(request.url).origin}/`,
      metadata: {
        order_id: orderId,
        orderflow_payment_method: paymentMethod,
      },
    }

    if (paymentMethod === 'bank-transfer') {
      payload.channels = ['bank_transfer']
    }

    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }
    )

    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.status) {
      return NextResponse.json(
        {
          message:
            result?.message ||
            'Paystack could not start this payment.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
    })
  } catch (error) {
    console.error('Paystack initialization failed:', error)

    return NextResponse.json(
      {
        message:
          'The payment service is temporarily unavailable. Please try again.',
      },
      { status: 500 }
    )
  }
}
