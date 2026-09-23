import { NextResponse } from 'next/server'
import { getOrderForPayment } from '../../../../lib/payments'
import { protectionClient, protectionUser } from '../../../../lib/protection-server'

export async function POST(request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return NextResponse.json({ message: 'Paystack test key has not been added yet.' }, { status: 503 })

    const { email, orderId, orderToken, paymentMethod = 'paystack' } = await request.json()
    if (!email) return NextResponse.json({ message: 'A buyer email address is required for payment.' }, { status: 400 })
    const { amountKobo, supabase, order } = await getOrderForPayment(orderId, orderToken)
    const { data: existing, error: lookupError } = await supabase.from('protected_payments_test').select('id').eq('order_id', order.id).maybeSingle()
    if (lookupError && !['42P01','PGRST205'].includes(lookupError.code)) throw lookupError
    let protectedRecord, buyerEmail=email
    if (paymentMethod === 'escrow') {
      const db=protectionClient(), user=await protectionUser(request,db)
      const {data,error}=await db.rpc('begin_protected_test',{p_token:orderToken,p_buyer:user.id,p_email:user.email})
      if(error) return NextResponse.json({message:error.message},{status:400})
      if(data.state !== 'awaiting_payment') return NextResponse.json({message:'This protected order is already paid.'},{status:409})
      protectedRecord=data; buyerEmail=user.email
      if(data.checkout_url) return NextResponse.json({authorizationUrl:data.checkout_url})
    } else if(existing) return NextResponse.json({message:'Continue this order from Protected payments.'},{status:409})

    const payload = {
      email: buyerEmail,
      amount: protectedRecord ? Math.round(Number(protectedRecord.amount)*100) : amountKobo,
      ...(protectedRecord ? {reference:`ofpt_${protectedRecord.id.replaceAll('-','')}`} : {}),
      currency: 'NGN',
      callback_url: protectedRecord ? `${new URL(request.url).origin}/protected-payment` : `${new URL(request.url).origin}/${orderToken ? `?order=${encodeURIComponent(orderToken)}` : ''}`,
      metadata: {
        order_id: orderId,
        order_token: orderToken,
        orderflow_payment_method: paymentMethod,
        ...(protectedRecord ? {protected_payment_id:protectedRecord.id} : {}),
      },
    }
    if (paymentMethod === 'bank-transfer') payload.channels = ['bank_transfer']

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.status) return NextResponse.json({ message: result?.message || 'Paystack could not start this payment.' }, { status: 502 })
    if(protectedRecord) {
      const {error}=await supabase.from('protected_payments_test').update({checkout_url:result.data.authorization_url}).eq('id',protectedRecord.id)
      if(error) throw error
    }
    return NextResponse.json({ authorizationUrl: result.data.authorization_url })
  } catch (error) {
    console.error('Paystack initialization failed:', error)
    return NextResponse.json({ message: 'The payment service is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
