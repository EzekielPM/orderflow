import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) throw new Error('Supabase server credentials are not configured.')

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getOrderForPayment(orderNumber, publicToken) {
  if (!orderNumber || !publicToken) throw new Error('Order payment details are missing.')

  const supabase = getAdminClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, merchant_id, public_token, quantity, unit_price, delivery_fee, status')
    .eq('order_number', orderNumber)
    .eq('public_token', publicToken)
    .maybeSingle()

  if (error) throw error
  if (!order) throw new Error('This order could not be found.')
  if (order.status === 'Cancelled') throw new Error('This order has been cancelled.')

  const amountKobo = Math.round(
    (Number(order.unit_price) * Number(order.quantity) + Number(order.delivery_fee)) * 100,
  )

  return { supabase, order, amountKobo }
}

export async function recordSuccessfulPayment(transaction) {
  const orderNumber = transaction?.metadata?.order_id
  const publicToken = transaction?.metadata?.order_token
  const reference = transaction?.reference
  const amountKobo = Number(transaction?.amount)

  if (!orderNumber || !publicToken || !reference || !Number.isFinite(amountKobo)) {
    throw new Error('Paystack returned incomplete payment details.')
  }

  const { supabase, order, amountKobo: expectedKobo } = await getOrderForPayment(orderNumber, publicToken)
  if (amountKobo !== expectedKobo) throw new Error('The paid amount does not match the order total.')

  const paidAt = transaction.paid_at || transaction.paidAt || new Date().toISOString()
  const payment = {
    order_id: order.id,
    merchant_id: order.merchant_id,
    provider: 'paystack',
    reference,
    amount: amountKobo / 100,
    currency: transaction.currency || 'NGN',
    channel: transaction.channel || 'paystack',
    status: 'success',
    paid_at: paidAt,
    provider_payload: transaction,
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .upsert(payment, { onConflict: 'reference' })
  if (paymentError) throw paymentError

  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'Payment received',
      payment_status: 'paid',
      payment_reference: reference,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .neq('status', 'Cancelled')
  if (orderError) throw orderError

  return { orderNumber: order.order_number, publicToken: order.public_token, merchantId: order.merchant_id, reference }
}
