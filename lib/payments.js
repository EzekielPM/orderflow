import { createClient } from '@supabase/supabase-js'
import { protectionClient } from './protection-server'

export function getPaymentMode() {
  const key = process.env.PAYSTACK_SECRET_KEY || ''
  if (key.startsWith('sk_test_')) return 'test'
  if (key.startsWith('sk_live_')) return 'live'
  throw new Error('Paystack is not configured.')
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) throw new Error('Supabase server credentials are not configured.')
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function getOrderForPayment(orderNumber, publicToken) {
  if (!orderNumber || !publicToken) throw new Error('Order payment details are missing.')
  const supabase = getAdminClient()
  const {data:order,error}=await supabase.rpc('prepare_order_payment',{p_number:orderNumber,p_token:publicToken})
  if(error){const failure=new Error(error.code==='P0001'?error.message:'The order could not be prepared. Please try again.');failure.status=error.code==='P0001'?409:503;throw failure}
  if (!order) throw new Error('This order could not be found.')
  if (order.status === 'Cancelled') throw new Error('This order has been cancelled.')
  const amountKobo = Math.round((Number(order.unit_price) * Number(order.quantity) + Number(order.delivery_fee)) * 100)
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) throw new Error('This order has an invalid payment amount.')
  return { supabase, order, amountKobo }
}

export async function recordSuccessfulPayment(transaction) {
  const mode = getPaymentMode()
  if (transaction?.status !== 'success' || transaction?.currency !== 'NGN' || transaction?.domain !== mode) {
    throw new Error('Payment status, currency or environment did not match.')
  }
  if (!transaction.metadata?.order_id || !transaction.metadata?.order_token || !transaction.reference ||
      !Number.isSafeInteger(transaction.amount) || transaction.amount <= 0 || !(transaction.paid_at || transaction.paidAt)) {
    throw new Error('Paystack returned incomplete payment details.')
  }
  if (transaction.metadata.protected_payment_id) protectionClient()
  const { data, error } = await getAdminClient().rpc('record_verified_paystack_payment', {
    p_transaction: transaction, p_expected_mode: mode,
  })
  if (error) throw error
  if (!data?.publicToken || data.reference !== transaction.reference || data.mode !== mode) {
    throw new Error('Payment confirmation could not be saved.')
  }
  return data
}
