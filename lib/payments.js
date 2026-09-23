import { createClient } from '@supabase/supabase-js'
import { protectionClient } from './protection-server'

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
  if (transaction.status !== 'success' || transaction.currency !== 'NGN') throw new Error('Payment is not a successful NGN transaction.')
  const {data: protectedRecord,error: protectionError}=await supabase.from('protected_payments_test').select('*').eq('order_id',order.id).maybeSingle()
  // The protected-payment migration is optional while that feature is paused.
  if(protectionError && !['42P01','PGRST205'].includes(protectionError.code)) throw protectionError
  if (protectedRecord || transaction.metadata.protected_payment_id) {
    protectionClient()
    if (!protectedRecord || protectedRecord.id !== transaction.metadata.protected_payment_id || transaction.domain !== 'test' || transaction.customer?.email?.toLowerCase() !== protectedRecord.buyer_email.toLowerCase()) throw new Error('Protected test payment identity mismatch.')
  }

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

  if(protectedRecord) {
    const {error}=await supabase.rpc('fund_protected_test',{p_id:protectedRecord.id,p_reference:reference,p_amount:amountKobo/100,p_email:transaction.customer.email,p_domain:transaction.domain})
    if(error) throw error
  } else {
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
    .neq('payment_status', 'paid')
  if (orderError) throw orderError
  }

  return { orderNumber: order.order_number, publicToken: order.public_token, merchantId: order.merchant_id, reference }
}
