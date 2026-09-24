'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './protected.css'

const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
const labels = { awaiting_payment: 'Awaiting test payment', held_test: 'Test payment protected', delivery_review: 'Delivery review', disputed: 'Dispute under review', released_test: 'Test release recorded', refunded_test: 'Test refund recorded' }

export default function ProtectedPayment() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [records, setRecords] = useState([])
  const [admin, setAdmin] = useState(false)
  const [order, setOrder] = useState(null)
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [reasons, setReasons] = useState({})
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const theme=localStorage.getItem('orderflow-theme') === 'dark'
    setDark(theme); document.documentElement.dataset.theme=theme?'dark':'light'
    if (!supabase) { setNotice('Supabase is not configured.'); setReady(true); return }
    let active=true
    supabase.auth.getSession().then(({data}) => {if(active){setSession(data.session);setReady(true)}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,value)=>{if(active){setSession(value);setReady(true)}})
    const orderToken=new URLSearchParams(window.location.search).get('order')
    if(orderToken) {
      setToken(orderToken)
      supabase.rpc('get_public_order',{p_token:orderToken}).maybeSingle().then(({data,error})=>{
        if(active) {if(error || !data)setNotice('This order link is not available.');else setOrder(data)}
      })
    }
    return ()=>{active=false;subscription.unsubscribe()}
  },[])

  async function api(path, options={}) {
    const {data}=await supabase.auth.getSession()
    if(!data.session) throw new Error('Sign in again to continue.')
    const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},cache:'no-store'})
    const result=await response.json()
    if(!response.ok) throw new Error(result.message || 'Could not complete this request.')
    return result
  }
  async function reload() {
    const result=await api('/api/protected-payments')
    setRecords(result.records);setAdmin(result.admin)
  }
  useEffect(()=>{
    if(!session) return
    let active=true
    async function load(){
      setBusy(true)
      try {
        const reference=new URLSearchParams(window.location.search).get('reference')
        if(reference) {
          const response=await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`,{cache:'no-store'})
          const result=await response.json()
          if(!response.ok || !result.paid) throw new Error(result.message || 'Payment has not been verified. Refresh to retry.')
          window.history.replaceState({},'',window.location.pathname)
          if(active)setNotice('Paystack test payment verified and saved.')
        }
        if(active)await reload()
      } catch(error){if(active)setNotice(error.message)}
      finally{if(active)setBusy(false)}
    }
    load()
    return ()=>{active=false}
  },[session?.user?.id])

  async function signIn(event){
    event.preventDefault();setBusy(true);setNotice('')
    try{
      const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+window.location.pathname+window.location.search}})
      if(error)throw error
      setNotice('Check your email and open the sign-in link in this browser. Then return to this order.')
    }catch(error){setNotice(error.message)}finally{setBusy(false)}
  }
  async function pay(orderNumber, orderToken){
    setBusy(true);setNotice('')
    try{
      const result=await api('/api/paystack/initialize',{method:'POST',body:JSON.stringify({email:session.user.email,orderId:orderNumber,orderToken,paymentMethod:'escrow'})})
      if(!result.authorizationUrl)throw new Error('Paystack did not return a checkout link.')
      window.location.assign(result.authorizationUrl)
    }catch(error){setNotice(error.message);setBusy(false)}
  }
  async function action(record,type){
    if(['confirm','refund','release'].includes(type) && !window.confirm(type==='confirm'?'Confirm that you received your order? This records the final test release.':'Record this final test decision?'))return
    setBusy(true);setNotice('')
    try{
      await api('/api/protected-payments',{method:'POST',body:JSON.stringify({id:record.id,action:type,reason:reasons[record.id] || ''})})
      await reload();setNotice('Updated and saved to your order history.')
    }catch(error){setNotice(error.message)}finally{setBusy(false)}
  }
  const linkedRecord=records.find(r=>r.orders?.public_token===token)
  return <main className="protection-page">
    <header><a href="/">‹ OrderFlow</a><button className="protect-secondary" aria-label="Switch theme" onClick={()=>{const value=!dark;setDark(value);localStorage.setItem('orderflow-theme',value?'dark':'light');document.documentElement.dataset.theme=value?'dark':'light'}}>{dark?'Light theme':'Dark theme'}</button></header>
    <section className="protect-intro"><span className="protect-tag">PAYSTACK TEST MODE</span><h1>Protected payments</h1><p>Review delivery, report an issue and follow the outcome in one place.</p><small>This workflow saves real records in OrderFlow. Payments use test funds; releases and refunds are simulated. No real money is held or transferred.</small></section>
    {notice && <p className="protect-notice" role="status">{notice}</p>}
    {!ready ? <p>Loading your account…</p> : !session ? <section className="protect-card"><h2>Verify your email to continue</h2><p>Your account keeps delivery confirmation and disputes under your control.</p><form onSubmit={signIn}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button disabled={busy || !supabase}>Send sign-in link</button></form></section> : <>
      <div className="protect-account"><span>Signed in as {session.user.email}{admin?' · Admin':''}</span><button className="protect-secondary" disabled={busy} onClick={async()=>{await supabase.auth.signOut();setRecords([]);setAdmin(false)}}>Sign out</button><button className="protect-secondary" disabled={busy} onClick={async()=>{setBusy(true);try{await reload();setNotice('Records refreshed.')}catch(e){setNotice(e.message)}finally{setBusy(false)}}}>Refresh</button></div>
      {order && !linkedRecord && <section className="protect-card"><h2>{order.order_number}</h2><p>{order.item_name} · {order.quantity} item(s)</p><p>{money(Number(order.unit_price)*Number(order.quantity)+Number(order.delivery_fee))}</p><p>A verified test payment will start the protected workflow. The seller will report delivery, then you have 48 hours to confirm receipt or raise an issue.</p><button disabled={busy} onClick={()=>pay(order.order_number,token)}>Continue to Paystack test checkout</button><small>Use a buyer account different from the seller account.</small></section>}
      <h2>{admin?'Payment review':'Your protected orders'}</h2>
      {!busy && !records.length && <p>No protected payments yet. Select Protected payment from an order’s checkout.</p>}
      <div className="protect-grid">{records.map(record=>{
        const buyer=record.buyer_id===session.user.id, seller=record.merchant_id===session.user.id
        const reviewer=admin&&!buyer&&!seller
        return <article className="protect-card" key={record.id}>
          <span className="protect-tag">{buyer?'BUYER':seller?'SELLER':'ADMIN REVIEW'}</span><h2>{record.order_number}</h2><p className="protect-amount">{money(record.amount)}</p><p className="protect-state">{labels[record.state]}</p>
          {record.release_at && record.state==='delivery_review' && <p>Review deadline: {new Date(record.release_at).toLocaleString()}. Without a dispute, the next daily check records a test release.</p>}
          {record.state==='disputed' && <p>Automatic release is paused. Buyer’s report: {record.dispute_reason}</p>}
          {['released_test','refunded_test'].includes(record.state)&&<p>Final test outcome saved. No real payout or refund was sent.</p>}
          {buyer&&record.state==='awaiting_payment'&&<button disabled={busy} onClick={()=>pay(record.order_number,record.orders.public_token)}>Pay with test funds</button>}
          {seller&&record.state==='held_test'&&<button disabled={busy} onClick={()=>action(record,'delivery')}>Report delivery</button>}
          {buyer&&record.state==='delivery_review'&&<button disabled={busy} onClick={()=>action(record,'confirm')}>I received my order</button>}
          {((buyer&&['held_test','delivery_review'].includes(record.state))||(reviewer&&record.state==='disputed'))&&<label>{buyer?'Describe your issue':'Review decision and reason'}<textarea maxLength={2000} minLength={10} value={reasons[record.id]||''} onChange={e=>setReasons({...reasons,[record.id]:e.target.value})}/></label>}
          {buyer&&['held_test','delivery_review'].includes(record.state)&&<button className="protect-secondary" disabled={busy||(reasons[record.id]||'').trim().length<10} onClick={()=>action(record,'dispute')}>Report an issue</button>}
          {reviewer&&record.state==='disputed'&&<div className="protect-actions"><button disabled={busy||(reasons[record.id]||'').trim().length<10} onClick={()=>action(record,'refund')}>Record test refund</button><button className="protect-secondary" disabled={busy||(reasons[record.id]||'').trim().length<10} onClick={()=>action(record,'release')}>Record test release</button></div>}
          <details><summary>Payment history</summary><ol>{record.history.map((item,i)=><li key={i}>{item.event}<small>{new Date(item.at).toLocaleString()}</small></li>)}</ol></details>
          <a href={`/?track=${encodeURIComponent(record.orders.public_token)}`}>View delivery tracking →</a>
        </article>
      })}</div>
    </>}
  </main>
}
