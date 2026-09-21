'use client'

import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const seedOrders = [
  { id: 'OF-1024', name: 'Ada Okafor', item: 'Leather handbag', qty: 1, amount: 18500, channel: 'Instagram', status: 'Pending' },
  { id: 'OF-1023', name: 'Tunde Bello', item: 'Wireless earbuds', qty: 1, amount: 7000, channel: 'WhatsApp', status: 'Confirmed' },
  { id: 'OF-1022', name: 'Mariam Musa', item: 'Skincare bundle', qty: 3, amount: 31200, channel: 'WhatsApp', status: 'Delivered' },
]

function AppShell({ children, back, title, onBack }) {
  return (
    <main className="phone">
      <header className="topbar">
        {back ? <button className="icon" onClick={() => onBack(back)} aria-label="Go back">←</button> : <span />}
        {title && <strong>{title}</strong>}
        <span />
      </header>
      {children}
    </main>
  )
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

export default function Home() {
  const [screen, setScreen] = useState('splash')
  const [merchant, setMerchant] = useState({ name: 'Ezekiel', business: 'Ezekiel Stores' })
  const [orders, setOrders] = useState(seedOrders)
  const [draft, setDraft] = useState({ name: '', phone: '', item: '', qty: 1, price: '', delivery: '', address: '' })
  const [selected, setSelected] = useState(seedOrders[0])
  const [notice, setNotice] = useState('')
  const [session, setSession] = useState(null)
  const [auth, setAuth] = useState({ name: '', email: '', password: '' })
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('orderflow-state')
    if (saved) {
      try { const parsed = JSON.parse(saved); setOrders(parsed.orders || seedOrders); setMerchant(parsed.merchant || merchant) } catch {}
    }
    const timer = setTimeout(() => setScreen('welcome'), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    const loadAccount = async () => {
      const [{ data: profile }, { data: savedOrders }] = await Promise.all([
        supabase.from('profiles').select('full_name,business_name').eq('id', session.user.id).maybeSingle(),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ])
      if (profile) setMerchant({ name: profile.full_name || 'Merchant', business: profile.business_name || 'My Store' })
      if (savedOrders?.length) setOrders(savedOrders.map(order => ({
        id: order.order_number,
        databaseId: order.id,
        name: order.customer_name,
        phone: order.customer_phone,
        item: order.item_name,
        qty: order.quantity,
        amount: Number(order.unit_price) * order.quantity + Number(order.delivery_fee),
        channel: order.channel,
        status: order.status,
      })))
    }
    loadAccount()
  }, [session])

  useEffect(() => {
    localStorage.setItem('orderflow-state', JSON.stringify({ orders, merchant }))
  }, [orders, merchant])

  const total = useMemo(() => Number(draft.price || 0) * Number(draft.qty || 1) + Number(draft.delivery || 0), [draft])
  const go = (next) => { setScreen(next); setNotice(''); window.scrollTo(0, 0) }
  const field = (key, label, type = 'text', placeholder = '') => <label><span>{label}</span><input type={type} value={draft[key]} placeholder={placeholder} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>
  const authField = (key, label, type = 'text', placeholder = '') => <label><span>{label}</span><input type={type} value={auth[key]} placeholder={placeholder} onChange={e => setAuth({ ...auth, [key]: e.target.value })} /></label>

  const signUp = async () => {
    if (!supabase) return go('setup')
    setAuthBusy(true)
    const { data, error } = await supabase.auth.signUp({ email: auth.email, password: auth.password, options: { data: { full_name: auth.name } } })
    setAuthBusy(false)
    if (error) return setNotice(error.message)
    setMerchant({ ...merchant, name: auth.name || 'Merchant' })
    if (!data.session) return setNotice('Check your email to confirm your account, then sign in.')
    go('setup')
  }

  const signIn = async () => {
    if (!supabase) return go('dashboard')
    setAuthBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password })
    setAuthBusy(false)
    if (error) return setNotice(error.message)
    go('dashboard')
  }

  const signInWithGoogle = async () => {
    if (!supabase) return setNotice('Connect Supabase to activate Google sign-in.')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setNotice(error.message)
  }

  const completeSetup = async () => {
    if (supabase && session) {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: merchant.name, business_name: merchant.business })
      if (error) return setNotice(error.message)
    }
    go('dashboard')
  }

  const saveOrder = async () => {
    if (supabase && session) {
      const orderNumber = `OF-${Date.now().toString().slice(-6)}`
      const { data, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        merchant_id: session.user.id,
        customer_name: draft.name,
        customer_phone: draft.phone,
        item_name: draft.item,
        quantity: Number(draft.qty || 1),
        unit_price: Number(draft.price || 0),
        delivery_fee: Number(draft.delivery || 0),
      }).select().single()
      if (error) return setNotice(error.message)
      setSelected({ id: data.order_number, databaseId: data.id, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, amount: total, channel: data.channel, status: data.status })
    }
    go('link')
  }

  const updateOrderStatus = async () => {
    if (supabase && session && selected.databaseId) {
      const { error } = await supabase.from('orders').update({ status: selected.status, updated_at: new Date().toISOString() }).eq('id', selected.databaseId)
      if (error) return setNotice(error.message)
    }
    setOrders(orders.map(order => order.id === selected.id ? selected : order))
    setNotice('Order status updated')
  }

  if (screen === 'splash') return <main className="splash"><div className="mark">≡</div><h1>OrderFlow</h1><p>Orders made simple.</p></main>


  if (screen === 'welcome') return <AppShell onBack={go}><section className="welcome"><div className="brand">OrderFlow</div><div className="mark">≡</div><h1>Turn every DM into a confirmed order.</h1><p>Create orders, confirm payments and keep customers updated from one simple place.</p><div className="channels"><span>● WhatsApp</span><span>● Instagram</span></div><button onClick={() => go('signup')}>Create a free account</button><button className="secondary" onClick={() => go('signin')}>Sign in</button></section></AppShell>

  if (screen === 'signup') return <AppShell onBack={go} back="welcome" title="Create your account"><section className="form"><h1>Let’s get you started</h1>{authField('name','Full name','text','Your full name')}{authField('email','Email address','email','you@business.com')}{authField('password','Password','password','At least 8 characters')}{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.name || !auth.email || auth.password.length < 8} onClick={signUp}>{authBusy ? 'Creating account…' : 'Continue'}</button><p className="center">Already have an account? <a onClick={() => go('signin')}>Sign in</a></p></section></AppShell>

  if (screen === 'signin') return <AppShell onBack={go} back="welcome" title="Welcome back"><section className="form"><button className="social" onClick={signInWithGoogle}>Continue with Google</button><button className="social" disabled title="Apple Developer membership is required">Continue with Apple · Coming later</button><div className="or">or</div>{authField('email','Email address','email','you@business.com')}{authField('password','Password','password','Your password')}{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.email || !auth.password} onClick={signIn}>{authBusy ? 'Signing in…' : 'Sign in'}</button><p className="center">New to OrderFlow? <a onClick={() => go('signup')}>Create an account</a></p>{!isSupabaseConfigured && <small className="center">Demo mode is active until Supabase is connected.</small>}</section></AppShell>

  if (screen === 'setup') return <AppShell onBack={go} back="signup" title="Set up your business"><section className="form"><h1>Make OrderFlow yours</h1><label><span>Business name</span><input value={merchant.business} onChange={e => setMerchant({ ...merchant, business: e.target.value })} /></label><label><span>What do you sell?</span><select><option>Fashion and accessories</option><option>Beauty and personal care</option><option>Food and drinks</option><option>Services</option></select></label><label><span>WhatsApp business number</span><input placeholder="0801 234 5678" /></label>{notice && <div className="notice">{notice}</div>}<button onClick={completeSetup}>Complete setup</button></section></AppShell>

  if (screen === 'dashboard') return <AppShell onBack={go}><section className="dashboard"><div className="dash-head"><div><div className="brand">OrderFlow</div><p>Good afternoon, {merchant.name}</p><h1>Orders</h1></div><span className="avatar">OE</span></div><button onClick={() => go('create')}>+ Create new order</button><div className="stats"><div><span>Awaiting</span><b>4</b></div><div><span>Active</span><b>7</b></div><div><span>Issues</span><b>1</b></div></div><div className="section-title"><h2>Recent orders</h2><span>View all</span></div><div className="orders">{orders.map(order => <button className="order" key={order.id} onClick={() => { setSelected(order); go('merchant-order') }}><div><b>{order.id} · {order.name}</b><span>{order.qty} item{order.qty > 1 ? 's' : ''} · {naira.format(order.amount)}</span><small>{order.channel} · Today</small></div><em className={order.status.toLowerCase()}>{order.status}</em></button>)}</div></section><nav><button>Home</button><button>Orders</button><button onClick={() => go('buyers')}>Buyers</button><button>Profile</button></nav></AppShell>

  if (screen === 'create') return <AppShell onBack={go} back="dashboard" title="Create order"><section className="form"><p className="step">Step 1 of 2 · Order details</p>{field('name','Customer name','text','Enter customer’s name')}{field('phone','Phone number','tel','0801 234 5678')}{field('item','Item or service','text','e.g. Leather handbag')}<div className="two">{field('qty','Quantity','number')}{field('price','Unit price','number','₦ 0.00')}</div>{field('delivery','Delivery fee','number','₦ 0.00')}<div className="total"><span>Order total</span><b>{naira.format(total)}</b></div><button disabled={!draft.name || !draft.item || !draft.price} onClick={() => go('review')}>Continue</button></section></AppShell>

  if (screen === 'review') return <AppShell onBack={go} back="create" title="Review order"><section className="form"><p className="step">Step 2 of 2 · Check before sharing</p><article className="card"><small>CUSTOMER</small><h3>{draft.name}</h3><p>{draft.phone}</p></article><h2>Order summary</h2><article className="card rows"><p><span>{draft.item} × {draft.qty}</span><b>{naira.format(Number(draft.price) * Number(draft.qty))}</b></p><p><span>Delivery fee</span><b>{naira.format(Number(draft.delivery || 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total)}</b></p></article>{notice && <div className="notice">{notice}</div>}<button onClick={saveOrder}>Create secure order link</button><button className="secondary" onClick={() => { setNotice('Draft saved'); go('dashboard') }}>Save as draft</button></section></AppShell>

  if (screen === 'link') {
    const orderId = selected?.id || 'OF-1025'
    const orderLink = `orderflow.ng/o/${orderId}`
    return <AppShell onBack={go}><section className="success"><div className="check">✓</div><h1>Order link is ready!</h1><p>Send this secure link to {draft.name || 'your customer'} so they can review and confirm the order.</p><div className="copy">{orderLink} <button onClick={async () => { try { await navigator.clipboard.writeText(`https://${orderLink}`); setNotice('Link copied') } catch { setNotice('Copy the link above') } }}>Copy</button></div>{notice && <div className="notice">{notice}</div>}<button className="whatsapp" onClick={() => go('confirm')}>Share on WhatsApp</button><button className="secondary">Share another way</button><button className="link" onClick={() => go('dashboard')}>Back to dashboard</button></section></AppShell>
  }

  if (screen === 'confirm') return <AppShell onBack={go}><section className="form"><div className="brand center">OrderFlow</div><h1>Hi {draft.name || 'Ada'}, check your order</h1><p>Confirm the details before making payment.</p><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>{draft.item || 'Leather handbag'} × {draft.qty}</span><b>{naira.format(Number(draft.price || 15000) * Number(draft.qty || 1))}</b></p><p><span>Delivery</span><b>{naira.format(Number(draft.delivery || 3500))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total || 18500)}</b></p></article><button onClick={() => go('delivery')}>Continue to delivery</button><button className="secondary" onClick={() => go('link')}>Request a correction</button></section></AppShell>

  if (screen === 'delivery') return <AppShell onBack={go} back="confirm" title="Delivery details"><section className="form"><p>Where should the seller deliver your order?</p>{field('name','Full name')}{field('phone','Phone number','tel')}{field('address','Delivery address','text','Street, area and city')}<div className="total"><span>Order total</span><b>{naira.format(total || 18500)}</b></div><button onClick={() => go('payment')}>Continue to payment</button></section></AppShell>

  if (screen === 'payment') return <AppShell onBack={go} title="Choose payment method"><section className="form"><p>Pay {naira.format(total || 18500)} securely for this order.</p>{['Bank transfer','Debit card','USSD','Pay on delivery'].map((item,i)=><label className="choice" key={item}><input type="radio" name="payment" defaultChecked={i===0}/><span><b>{item}</b><small>{i===0?'Get a dedicated account for this order':'Available in the live version'}</small></span></label>)}<button onClick={() => go('paid')}>Pay {naira.format(total || 18500)}</button><small className="center">Test payment only. No money will be charged.</small></section></AppShell>

  if (screen === 'paid') return <AppShell onBack={go}><section className="success"><div className="check">✓</div><h1>Payment successful</h1><p>Your seller has been notified.</p><article className="card rows"><p><span>Amount paid</span><b>{naira.format(total || 18500)}</b></p><p><span>Order ID</span><b>OF-1025</b></p><p><span>Method</span><b>Bank transfer</b></p></article><button onClick={() => go('tracking')}>Track my order</button><button className="secondary">Download receipt</button></section></AppShell>

  if (screen === 'tracking') return <AppShell onBack={go} back="paid"><section className="form"><div className="brand center">OrderFlow</div><h1>Your order is on the way</h1><p>Last updated today, 2:30 PM</p><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>Total</span><b>{naira.format(total || 18500)}</b></p></article><h2>Order progress</h2><div className="timeline"><p className="done"><b>Order confirmed</b><span>You confirmed the details</span></p><p className="done"><b>Payment received</b><span>Seller confirmed your payment</span></p><p className="current"><b>Out for delivery</b><span>Your package is on the way</span></p><p><b>Delivered</b><span>Waiting for delivery confirmation</span></p></div><button className="secondary">Contact seller</button></section></AppShell>

  if (screen === 'buyers') return <AppShell onBack={go} back="dashboard"><section className="dashboard"><div className="brand">OrderFlow</div><h1>Buyers</h1><p>People who have ordered from your store.</p><input className="search" placeholder="Search name, phone or order ID" />{orders.map(order=><button className="buyer" key={order.id} onClick={()=>{setSelected(order);go('merchant-order')}}><span className="avatar">{order.name.split(' ').map(n=>n[0]).join('')}</span><span><b>{order.name}</b><small>{order.phone || '0801 234 5678'} · {order.channel}</small></span><em>View details</em></button>)}<button onClick={() => go('create')}>Create order for this buyer</button></section></AppShell>

  if (screen === 'merchant-order') return <AppShell onBack={go} back="dashboard" title={`Order ${selected.id}`}><section className="form"><p className="step">Created today, 10:42 AM</p><article className="card"><small>CUSTOMER</small><h3>{selected.name}</h3><p>{selected.phone || '0801 234 5678'}</p></article><article className="card rows"><p><span>{selected.item} × {selected.qty}</span><b>{naira.format(selected.amount - 3500)}</b></p><p><span>Delivery</span><b>{naira.format(3500)}</b></p><p className="strong"><span>Total</span><b>{naira.format(selected.amount)}</b></p></article><label><span>Update progress</span><select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}><option>Pending</option><option>Confirmed</option><option>Payment received</option><option>Out for delivery</option><option>Delivered</option></select></label><button onClick={updateOrderStatus}>Update order status</button>{notice&&<div className="notice">{notice}</div>}</section></AppShell>

  return null
}
