import { NextResponse } from 'next/server'
import { recordSuccessfulPayment } from '../../../../lib/payments'

export async function GET(request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const reference = new URL(request.url).searchParams.get('reference')
  if (!secretKey || !reference) return NextResponse.json({ paid: false, message: 'Payment verification details are missing.' }, { status: 400 })

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store',
  })
  const result = await response.json()
  const paid = response.ok && result.status && result.data?.status === 'success'
  let paymentRecord = null
  if (paid) {
    try {
      paymentRecord = await recordSuccessfulPayment(result.data)
    } catch (error) {
      console.error('Verified payment could not be recorded:', error)
      return NextResponse.json({ paid: false, message: 'Payment was verified but could not be recorded. Please contact the seller.' }, { status: 500 })
    }
  }
  return NextResponse.json({ paid, message: paid ? 'Payment verified.' : result.message || 'Payment was not successful.', orderId: paymentRecord?.orderNumber, orderToken: paymentRecord?.publicToken, merchantId: paymentRecord?.merchantId }, { status: paid ? 200 : 400 })
}
