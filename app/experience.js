'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })

export function Icon({ name, className = '' }) {
  const paths = {
    shop: <><path d="M3 10h18l-2-7H5l-2 7Z M5 10v11h14V10 M9 21v-7h6v7"/><path d="M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0"/></>,
    cart: <><path d="M2 3h3l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/></>,
    account: <><circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
    moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>,
    arrow: <path d="m9 5 7 7-7 7"/>,
    back: <path d="m15 5-7 7 7 7"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    box: <><path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7 4l9 5"/></>,
    truck: <><path d="M2 5h12v12H2V5Zm12 5h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    link: <><path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0)"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  }
  return <svg className={`ux-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.box}</svg>
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    let saved
    try { saved = localStorage.getItem('orderflow-theme') } catch {}
    const next = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'
  }, [])
  return <button className="ux-theme" aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} onClick={() => {
    const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'
    try { localStorage.setItem('orderflow-theme', next ? 'dark' : 'light') } catch {}
  }}><Icon name={dark ? 'sun' : 'moon'}/></button>
}

export function ProductPhoto({ product, className = '' }) {
  const src = product?.image_url
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return <div className={`ux-photo ${className}`}>
    {src && !failed ? <Image src={src} alt={product.name || 'Product'} fill unoptimized sizes="(max-width: 600px) 50vw, 280px" onError={() => setFailed(true)}/> : <span className="ux-photo-empty"><Icon name="box"/><small>No photo yet</small></span>}
  </div>
}

export function BuyerNav({ active, count = 0, onNavigate }) {
  return <nav className="ux-buyer-nav" aria-label="Buyer navigation">
    {[['shop','Shop'],['cart','Cart'],['orders','My orders'],['account','Account']].map(([key,label]) => {
      const children = <><span className="ux-nav-symbol"><Icon name={key}/>{key === 'cart' && count > 0 && <small>{count > 99 ? '99+' : count}</small>}</span><span>{label}</span></>
      return onNavigate ? <button key={key} aria-current={active === key ? 'page' : undefined} onClick={() => onNavigate(key)}>{children}</button> : <a key={key} aria-current={active === key ? 'page' : undefined} href={`/shop${key === 'shop' ? '' : `?tab=${key}`}`}>{children}</a>
    })}
  </nav>
}

export function StatusBadge({ status }) {
  return <span className={`ux-status status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

export function EmptyState({ icon = 'box', title, children }) {
  return <div className="ux-empty"><span className="ux-empty-icon"><Icon name={icon}/></span><h2>{title}</h2>{children}</div>
}

export function CheckoutSummary({ business, items = [], subtotal = 0, delivery = 0, total, children }) {
  return <aside className="ux-summary"><small className="ux-eyebrow">Your order from</small><h2>{business}</h2>
    {items.map((row, index) => <div className="ux-summary-item" key={row.product?.id || index}>
      {row.product && <ProductPhoto product={row.product}/>}<span>{row.product?.name || row.name}<small>Qty {row.quantity}</small></span>
      <b>{money.format(Number(row.product?.price ?? row.unit_price) * Number(row.quantity))}</b>
    </div>)}
    <dl className="ux-totals"><div><dt>Subtotal</dt><dd>{money.format(subtotal)}</dd></div><div><dt>Delivery</dt><dd>{Number(delivery) === 0 ? 'Free' : money.format(delivery)}</dd></div><div className="ux-total"><dt>Total</dt><dd>{money.format(total ?? Number(subtotal) + Number(delivery))}</dd></div></dl>{children}
  </aside>
}

export function VendorOverview({ merchant, orders, products, onNavigate, onOrder, onEditProduct, onShare, notice }) {
  const pending = orders.filter(o => o.status === 'Pending')
  const ready = orders.filter(o => o.status === 'Payment received')
  const out = orders.filter(o => o.status === 'Out for delivery')
  const low = products.filter(p => p.active && Number(p.stock_quantity) <= 5).sort((a,b) => a.stock_quantity - b.stock_quantity)
  const needs = [...ready, ...pending].slice(0, 4)
  const name = merchant.name?.split(' ')[0] || 'there'
  return <section className="dashboard ux-overview">
    <div className="ux-heading"><div><p>Hello, {name}</p><h1>Your business, at a glance.</h1><span>Here’s what needs your attention.</span></div><button className="ux-primary" onClick={() => onNavigate('create')}><Icon name="plus"/>Create order</button></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    <div className="ux-metrics">
      {[['Awaiting confirmation',pending.length,'clock'],['Ready to dispatch',ready.length,'box'],['Out for delivery',out.length,'truck']].map(([label,value,icon]) => <article key={label}><Icon name={icon}/><span>{label}</span><strong>{value}</strong></article>)}
    </div>
    <div className="ux-workspace"><div>
      <article className="ux-panel"><div className="ux-section-head"><h2>Needs your attention</h2><button className="ux-text" onClick={() => onNavigate('orders')}>All orders <Icon name="arrow"/></button></div>
        {needs.length ? needs.map(o => <button className="ux-attention-row" key={o.id} onClick={() => onOrder(o)}><span className="ux-initial">{o.name?.slice(0,1).toUpperCase() || 'B'}</span><span><b>{o.name}</b><small>{o.item}</small><StatusBadge status={o.status}/></span><span><b>{money.format(o.amount)}</b><small>{o.status === 'Payment received' ? 'Arrange delivery' : 'Review order'} <Icon name="arrow"/></small></span></button>) : <EmptyState icon="check" title="You’re all caught up"><p>New orders and payments will appear here.</p></EmptyState>}
      </article>
      <article className="ux-panel"><div className="ux-section-head"><h2>Recent activity</h2><span className="ux-muted">Updates automatically</span></div>
        {orders.length ? orders.slice().sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0,4).map(o => <button className="ux-activity-row" key={o.id} onClick={() => onOrder(o)}><span><b>{o.name}</b><small>{o.id}</small></span><StatusBadge status={o.status}/></button>) : <p className="ux-muted">Create an order or share your store to get started.</p>}
      </article>
    </div><aside>
      <article className="ux-store-invite"><span className="ux-eyebrow">Your storefront</span><Icon name="shop"/><h2>{merchant.business || 'Your store'}</h2><p>One link to your products.<br/>Ready for your next customer.</p><button onClick={onShare}><Icon name="link"/>Share store</button><a href={`/?store=${merchant.id || ''}`} onClick={event => { if (!merchant.id) { event.preventDefault(); onNavigate('products') } }}>View storefront <Icon name="arrow"/></a></article>
      <article className="ux-panel"><div className="ux-section-head"><h2>Stock check</h2><button className="ux-text" onClick={() => onNavigate('products')}>Products</button></div>
        {low.length ? low.slice(0,3).map(p => <button className="ux-stock-row" key={p.id} onClick={() => onEditProduct(p)}><ProductPhoto product={p}/><span><b>{p.name}</b><small>{Number(p.stock_quantity) === 0 ? 'Out of stock' : `${p.stock_quantity} left`}</small></span><Icon name="arrow"/></button>) : <p className="ux-muted">{products.length ? 'No products are running low.' : 'Add your first product to open your catalogue.'}</p>}
      </article>
    </aside></div>
  </section>
}

export function TrackingView({ order, business, connection, onRetry, onShare, onContact, onShop, onPay, notice }) {
  const steps = ['Confirmed','Payment received','Out for delivery','Delivered']
  const position = steps.indexOf(order.status)
  const copy = {
    Pending: ['Waiting for confirmation', 'Your order is waiting to be confirmed.'],
    Confirmed: ['Your order is confirmed', 'Complete payment to keep your order moving.'],
    'Payment received': ['Payment received', 'Your seller can now prepare your order. The next update will appear here.'],
    'Out for delivery': ['Your order is on the way', 'Your seller has marked this order as out for delivery.'],
    Delivered: ['Your order has arrived', 'Your seller has marked this order as delivered. Thank you for shopping.'],
    Cancelled: ['This order was cancelled', 'Contact your seller for help with this order or any payment already made.'],
  }
  const [title,detail] = copy[order.status] || ['Checking your order', 'We are loading the latest order status.']
  return <section className="ux-tracking"><div className="ux-heading"><div><small className="ux-eyebrow">{business}</small><h1>Track your order</h1><span className="ux-order-id">{order.id}</span></div><button className="ux-secondary" onClick={onShare}><Icon name="link"/>Save tracking link</button></div>
    <div className="ux-tracking-grid"><article className="ux-panel ux-tracking-main"><div className={`ux-delivery-hero ${order.status === 'Cancelled' ? 'is-cancelled' : ''}`}><span className="ux-delivery-icon"><Icon name={order.status === 'Delivered' ? 'check' : order.status === 'Out for delivery' ? 'truck' : 'box'}/></span><h2 aria-live="polite">{title}</h2><p>{detail}</p></div>
      <div className="ux-sync" role="status"><span className={connection === 'offline' ? 'offline' : ''}/>{connection === 'offline' ? 'Connection interrupted. Showing the last update.' : 'This page checks for updates automatically.'}<button onClick={onRetry} className="ux-text">Refresh</button></div>
      {order.status !== 'Cancelled' && <ol className="ux-progress">{steps.map((step,index) => <li key={step} className={index < position ? 'complete' : index === position ? 'current' : ''} aria-current={index === position ? 'step' : undefined}><span>{index < position ? <Icon name="check"/> : index + 1}</span><div><b>{step === 'Confirmed' ? 'Order confirmed' : step}</b><small>{index < position ? 'Completed' : index === position ? 'Current stage' : 'Next'}</small></div></li>)}</ol>}
      {order.updatedAt && <p className="ux-updated">Last order update: {new Date(order.updatedAt).toLocaleString('en-NG', {dateStyle:'medium',timeStyle:'short'})}</p>}
      {['Pending','Confirmed'].includes(order.status) && ['unpaid','failed'].includes(order.paymentStatus) && <div className="ux-resume-payment"><button className="ux-primary" onClick={onPay}>Continue to payment <Icon name="arrow"/></button></div>}
    </article><aside><CheckoutSummary business={business} items={order.lineItems?.length ? order.lineItems : [{name:order.item,quantity:order.qty,unit_price:order.unitPrice}]} subtotal={Number(order.unitPrice) * Number(order.qty || 1)} delivery={order.deliveryFee} total={order.amount}/><article className="ux-help"><h2>Need a hand?</h2><p>Contact your seller about delivery or your order.</p><button className="ux-secondary" onClick={onContact}>Contact seller</button></article></aside></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    <button className="ux-secondary ux-continue" onClick={onShop}>Continue shopping <Icon name="arrow"/></button>
  </section>
}
