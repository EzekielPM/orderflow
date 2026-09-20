'use client'

import { useEffect, useMemo, useState } from 'react'

const seedOrders = [
  { id: 'OF-1024', name: 'Ada Okafor', item: 'Leather handbag', qty: 1, amount: 18500, channel: 'Instagram', status: 'Pending' },
  { id: 'OF-1023', name: 'Tunde Bello', item: 'Wireless earbuds', qty: 1, amount: 7000, channel: 'WhatsApp', status: 'Confirmed' },
  { id: 'OF-1022', name: 'Mariam Musa', item: 'Skincare bundle', qty: 3, amount: 31200, channel: 'WhatsApp', status: 'Delivered' },
]

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

export default function Home() {
  const [screen, setScreen] = useState('splash')
  const [merchant, setMerchant] = useState({ name: 'Ezekiel', business: 'Ezekiel Stores' })
  const [orders, setOrders] = useState(seedOrders)
  const [draft, setDraft] = useState({ name: '', phone: '', item: '', qty: 1, price: '', delivery: '', address: '' })
  const [selected, setSelected] = useState(seedOrders[0])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('orderflow-state')
    if (saved) {
      try { const parsed = JSON.parse(saved); setOrders(parsed.orders || seedOrders); setMerchant(parsed.merchant || merchant) } catch {}
    }
    const timer = setTimeout(() => setScreen('welcome'), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('orderflow-state', JSON.stringify({ orders, merchant }))
  }, [orders, merchant])

  const total = useMemo(() => Number(draft.price || 0) * Number(draft.qty || 1) + Number(draft.delivery || 0), [draft])
  const go = (next) => { setScreen(next); setNotice(''); window.scrollTo(0, 0) }
  const field = (key, label, type = 'text', placeholder = '') => <label><span>{label}</span><input type={type} value={draft[key]} placeholder={placeholder} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>

  if (screen === 'splash') return <main className="splash"><div className="mark">≡</div><h1>OrderFlow</h1><p>Orders made simple.</p></main>

  const Shell = ({ children, back, title }) => <main className="phone"><header className="topbar">{back ? <button className="icon" onClick={() => go(back)} aria-label="Go back">←</button> : <span />}{title && <strong>{title}</strong>}<span /></header>{children}</main>

  if (screen === 'welcome') return <Shell><section className="welcome"><div className="brand">OrderFlow</div><div className="mark">≡</div><h1>Turn every DM into a confirmed order.</h1><p>Create orders, confirm payments and keep customers updated from one simple place.</p><div className="channels"><span>● WhatsApp</span><span>● Instagram</span></div><button onClick={() => go('signup')}>Create a free account</button><button className="secondary" onClick={() => go('signin')}>Sign in</button></section></Shell>

  if (screen === 'signup') return <Shell back="welcome" title="Create your account"><section className="form"><h1>Let’s get you started</h1><label><span>Full name</span><input placeholder="Your full name" /></label><label><span>Email address</span><input type="email" placeholder="you@business.com" /></label><label><span>Password</span><input type="password" placeholder="At least 8 characters" /></label><button onClick={() => go('setup')}>Continue</button><p className="center">Already have an account? <a onClick={() => go('signin')}>Sign in</a></p></section></Shell>

  if (screen === 'signin') return <Shell back="welcome" title="Welcome back"><section className="form"><button className="social">Continue with Google</button><button className="social">Continue with Apple</button><div className="or">or</div><label><span>Email or phone</span><input placeholder="Your email or phone" /></label><label><span>Password</span><input type="password" placeholder="Your password" /></label><button onClick={() => go('dashboard')}>Sign in</button><p className="center">New to OrderFlow? <a onClick={() => go('signup')}>Create an account</a></p></section></Shell>

  if (screen === 'setup') return <Shell back="signup" title="Set up your business"><section className="form"><h1>Make OrderFlow yours</h1><label><span>Business name</span><input defaultValue={merchant.business} onChange={e => setMerchant({ ...merchant, business: e.target.value })} /></label><label><span>What do you sell?</span><select><option>Fashion and accessories</option><option>Beauty and personal care</option><option>Food and drinks</option><option>Services</option></select></label><label><span>WhatsApp business number</span><input placeholder="0801 234 5678" /></label><button onClick={() => go('dashboard')}>Complete setup</button></section></Shell>

  if (screen === 'dashboard') return <Shell><section className="dashboard"><div className="dash-head"><div><div className="brand">OrderFlow</div><p>Good afternoon, {merchant.name}</p><h1>Orders</h1></div><span className="avatar">OE</span></div><button onClick={() => go('create')}>+ Create new order</button><div className="stats"><div><span>Awaiting</span><b>4</b></div><div><span>Active</span><b>7</b></div><div><span>Issues</span><b>1</b></div></div><div className="section-title"><h2>Recent orders</h2><span>View all</span></div><div className="orders">{orders.map(order => <button className="order" key={order.id} onClick={() => { setSelected(order); go('merchant-order') }}><div><b>{order.id} · {order.name}</b><span>{order.qty} item{order.qty > 1 ? 's' : ''} · {naira.format(order.amount)}</span><small>{order.channel} · Today</small></div><em className={order.status.toLowerCase()}>{order.status}</em></button>)}</div></section><nav><button>Home</button><button>Orders</button><button onClick={() => go('buyers')}>Buyers</button><button>Profile</button></nav></Shell>

  if (screen === 'create') return <Shell back="dashboard" title="Create order"><section className="form"><p className="step">Step 1 of 2 · Order details</p>{field('name','Customer name','text','Enter customer’s name')}{field('phone','Phone number','tel','0801 234 5678')}{field('item','Item or service','text','e.g. Leather handbag')}<div className="two">{field('qty','Quantity','number')}{field('price','Unit price','number','₦ 0.00')}</div>{field('delivery','Delivery fee','number','₦ 0.00')}<div className="total"><span>Order total</span><b>{naira.format(total)}</b></div><button disabled={!draft.name || !draft.item || !draft.price} onClick={() => go('review')}>Continue</button></section></Shell>

  if (screen === 'review') return <Shell back="create" title="Review order"><section className="form"><p className="step">Step 2 of 2 · Check before sharing</p><article className="card"><small>CUSTOMER</small><h3>{draft.name}</h3><p>{draft.phone}</p></article><h2>Order summary</h2><article className="card rows"><p><span>{draft.item} × {draft.qty}</span><b>{naira.format(Number(draft.price) * Number(draft.qty))}</b></p><p><span>Delivery fee</span><b>{naira.format(Number(draft.delivery || 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total)}</b></p></article><button onClick={() => go('link')}>Create secure order link</button><button className="secondary" onClick={() => { setNotice('Draft saved'); go('dashboard') }}>Save as draft</button></section></Shell>

  if (screen === 'link') return <Shell><section className="success"><div className="check">✓</div><h1>Order link is ready!</h1><p>Send this secure link to {draft.name || 'your customer'} so they can review and confirm the order.</p><div className="copy">orderflow.ng/o/OF-1025 <button onClick={() => setNotice('Link copied')}>Copy</button></div>{notice && <div className="notice">{notice}</div>}<button className="whatsapp" onClick={() => go('confirm')}>Share on WhatsApp</button><button className="secondary">Share another way</button><button className="link" onClick={() => go('dashboard')}>Back to dashboard</button></section></Shell>

  if (screen === 'confirm') return <Shell><section className="form"><div className="brand center">OrderFlow</div><h1>Hi {draft.name || 'Ada'}, check your order</h1><p>Confirm the details before making payment.</p><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>{draft.item || 'Leather handbag'} × {draft.qty}</span><b>{naira.format(Number(draft.price || 15000))}</b></p><p><span>Delivery</span><b>{naira.format(Number(draft.delivery || 3500))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total || 18500)}</b></p></article><button onClick={() => go('delivery')}>Continue to delivery</button><button className="secondary" onClick={() => go('link')}>Request a correction</button></section></Shell>

  if (screen === 'delivery') return <Shell back="confirm" title="Delivery details"><section className="form"><p>Where should the seller deliver your order?</p>{field('name','Full name')}{field('phone','Phone number','tel')}{field('address','Delivery address','text','Street, area and city')}<div className="total"><span>Order total</span><b>{naira.format(total || 18500)}</b></div><button onClick={() => go('payment')}>Continue to payment</button></section></Shell>

  if (screen === 'payment') return <Shell title="Choose payment method"><section className="form"><p>Pay {naira.format(total || 18500)} securely for this order.</p>{['Bank transfer','Debit card','USSD','Pay on delivery'].map((item,i)=><label className="choice" key={item}><input type="radio" name="payment" defaultChecked={i===0}/><span><b>{item}</b><small>{i===0?'Get a dedicated account for this order':'Available in the live version'}</small></span></label>)}<button onClick={() => go('paid')}>Pay {naira.format(total || 18500)}</button><small className="center">Test payment only. No money will be charged.</small></section></Shell>

  if (screen === 'paid') return <Shell><section className="success"><div className="check">✓</div><h1>Payment successful</h1><p>Your seller has been notified.</p><article className="card rows"><p><span>Amount paid</span><b>{naira.format(total || 18500)}</b></p><p><span>Order ID</span><b>OF-1025</b></p><p><span>Method</span><b>Bank transfer</b></p></article><button onClick={() => go('tracking')}>Track my order</button><button className="secondary">Download receipt</button></section></Shell>

  if (screen === 'tracking') return <Shell back="paid"><section className="form"><div className="brand center">OrderFlow</div><h1>Your order is on the way</h1><p>Last updated today, 2:30 PM</p><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>Total</span><b>{naira.format(total || 18500)}</b></p></article><h2>Order progress</h2><div className="timeline"><p className="done"><b>Order confirmed</b><span>You confirmed the details</span></p><p className="done"><b>Payment received</b><span>Seller confirmed your payment</span></p><p className="current"><b>Out for delivery</b><span>Your package is on the way</span></p><p><b>Delivered</b><span>Waiting for delivery confirmation</span></p></div><button className="secondary">Contact seller</button></section></Shell>

  if (screen === 'buyers') return <Shell back="dashboard"><section className="dashboard"><div className="brand">OrderFlow</div><h1>Buyers</h1><p>People who have ordered from your store.</p><input className="search" placeholder="Search name, phone or order ID" />{orders.map(order=><button className="buyer" key={order.id} onClick={()=>{setSelected(order);go('merchant-order')}}><span className="avatar">{order.name.split(' ').map(n=>n[0]).join('')}</span><span><b>{order.name}</b><small>{order.phone || '0801 234 5678'} · {order.channel}</small></span><em>View details</em></button>)}<button onClick={() => go('create')}>Create order for this buyer</button></section></Shell>

  if (screen === 'merchant-order') return <Shell back="dashboard" title={`Order ${selected.id}`}><section className="form"><p className="step">Created today, 10:42 AM</p><article className="card"><small>CUSTOMER</small><h3>{selected.name}</h3><p>0801 234 5678</p></article><article className="card rows"><p><span>{selected.item} × {selected.qty}</span><b>{naira.format(selected.amount - 3500)}</b></p><p><span>Delivery</span><b>{naira.format(3500)}</b></p><p className="strong"><span>Total</span><b>{naira.format(selected.amount)}</b></p></article><label><span>Update progress</span><select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}><option>Pending</option><option>Confirmed</option><option>Out for delivery</option><option>Delivered</option></select></label><button onClick={()=>{setOrders(orders.map(o=>o.id===selected.id?selected:o));setNotice('Order status updated')}}>Update order status</button>{notice&&<div className="notice">{notice}</div>}</section></Shell>

  return null
}
