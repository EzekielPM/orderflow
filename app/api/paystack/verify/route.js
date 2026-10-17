import { NextResponse } from 'next/server'
import { getPaymentMode, recordSuccessfulPayment } from '../../../../lib/payments'

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function GET(request) {
  const reference = new URL(request.url).searchParams.get('reference')
  if (!reference || reference.length > 200) return json({ paid: false, status: 'unavailable', message: 'A valid payment reference is required.' }, 400)
  let mode
  try { mode = getPaymentMode() } catch {
    return json({ paid: false, status: 'unavailable', message: 'Payment verification is temporarily unavailable. Please try again.' }, 503)
  }
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }, cache: 'no-store', signal: AbortSignal.timeout(15000),
    })
    const result = await response.json()
    if (!response.ok || result.status !== true || !result.data) {
      return json({ paid: false, mode, status: 'unavailable', message: 'We could not confirm this payment with Paystack. Check again before paying a second time.' }, 502)
    }
    const transaction = result.data
    if (transaction.reference !== reference || transaction.domain !== mode) {
      return json({ paid: false, mode, status: 'review', message: 'The payment details do not match this checkout. Contact your seller with the reference below.' }, 409)
    }
    if (transaction.status !== 'success') {
      const messages = {
        failed: 'This payment attempt failed. No successful payment has been confirmed.',
        abandoned: 'This payment was not completed. No successful payment has been confirmed.',
        reversed: 'Paystack reports that this payment was reversed. Contact your seller before trying again.',
      }
      const status = Object.hasOwn(messages, transaction.status) ? transaction.status : 'pending'
      return json({ paid: false, mode, status, message: messages[status] || 'Paystack has not confirmed this payment yet. Your order remains unpaid while we check.' })
    }
    let payment
    try { payment = await recordSuccessfulPayment(transaction) } catch (error) {
      console.error('Paystack confirmation requires review:', error.code || 'recording_failed')
      return json({ paid: false, mode, status: 'review', message: 'Paystack reports success, but we could not safely match and save it to this order. Do not pay again. Check again or contact your seller with the reference below.' }, 409)
    }
    return json({ paid: true, status: 'success', mode: payment.mode,
      message: payment.mode === 'test' ? 'Test payment confirmed. No real money was received.' : 'Payment confirmed.',
      orderId: payment.orderNumber, orderToken: payment.publicToken, merchantId: payment.merchantId, reference: payment.reference })
  } catch {
    return json({ paid: false, mode, status: 'unavailable', message: 'We could not reach the payment service. Your payment has not been confirmed here. Please check again before making another payment.' }, 503)
  }
}
