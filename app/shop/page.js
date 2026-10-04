'use client'

import {useEffect, useRef, useState} from 'react'
import {supabase} from '../../lib/supabase'
import {readCart, writeCart, readAllCarts, rememberStore} from '../../lib/buyer-context'
import {Icon, ThemeToggle, ProductPhoto, BuyerNav, EmptyState, StatusBadge, money} from '../experience'

const categories = ['', 'Fashion', 'Beauty', 'Food & drinks', 'Electronics', 'Home & living', 'Health', 'Services', 'Other']
const tabs = ['shop', 'cart', 'orders', 'account']

export default function Shop() {
  const [tab, setTab] = useState('shop')
  const [view, setView] = useState('products')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [offset, setOffset] = useState(0)
  const [results, setResults] = useState([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [orders, setOrders] = useState([])
  const [groups, setGroups] = useState([])
  const [count, setCount] = useState(0)
  const [notice, setNotice] = useState('')
  const requestVersion = useRef(0)

  function navigate(next) {
    setTab(next); setError(''); setNotice('')
    window.history.pushState({}, '', `/shop${next === 'shop' ? '' : `?tab=${next}`}`)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const syncTab = () => {
      const next = new URLSearchParams(window.location.search).get('tab')
      setTab(tabs.includes(next) ? next : 'shop')
    }
    const syncCount = () => setCount(readAllCarts().reduce((sum, group) => sum + group.cart.reduce((n, row) => n + row.quantity, 0), 0))
    syncTab(); syncCount()
    window.addEventListener('popstate', syncTab)
    window.addEventListener('orderflow-cart-change', syncCount)
    window.addEventListener('storage', syncCount)
    if (supabase) {
      supabase.auth.getSession().then(({data}) => {setSession(data.session); setAuthReady(true)})
    } else setAuthReady(true)
    const listener = supabase?.auth.onAuthStateChange((_, next) => {setSession(next); setAuthReady(true)})
    return () => {
      window.removeEventListener('popstate', syncTab)
      window.removeEventListener('orderflow-cart-change', syncCount)
      window.removeEventListener('storage', syncCount)
      listener?.data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const version = ++requestVersion.current
    let active = true
    setLoading(true); setError('')
    const timer = setTimeout(async () => {
      try {
        if (!supabase && tab !== 'account') throw Error('The shop is temporarily unavailable. Please try again shortly.')
        if (tab === 'shop') {
          const {data, error} = await supabase.rpc(view === 'products' ? 'search_public_products' : 'search_public_stores', {p_search:search.trim(), p_category:category, p_offset:offset})
          if (error) throw error
          if (active && version === requestVersion.current) {setResults((data || []).slice(0,12)); setMore((data || []).length > 12)}
        }
        if (tab === 'orders' && session) {
          const {data, error} = await supabase.rpc('get_buyer_saved_orders')
          if (error) throw error
          if (active) setOrders(data || [])
        }
        if (tab === 'cart') {
          const local = readAllCarts()
          const fresh = await Promise.all(local.map(async group => {
            const {data, error} = await supabase.rpc('get_public_store', {p_merchant:group.store}).maybeSingle()
            if (error || !data) return {...group, unavailable:true}
            const catalogue = Array.isArray(data.products) ? data.products : []
            // Show unavailable items explicitly so buyers understand any changes.
            const cart = group.cart.map(row => {
              const product = catalogue.find(p => p.id === row.product.id)
              return {product: product || row.product, quantity:row.quantity, missing:!product || product.active === false, unavailable:!product || product.active === false || Number(product.stock_quantity) < row.quantity}
            })
            let pendingToken = ''
            try {
              const pending = JSON.parse(sessionStorage.getItem(`orderflow-checkout:${group.store}`) || 'null')
              const fingerprint = JSON.stringify(group.cart.map(row => ({product_id:row.product.id,quantity:row.quantity})).sort((a,b) => a.product_id.localeCompare(b.product_id)))
              if (pending?.fingerprint === fingerprint) pendingToken = pending.publicToken || ''
            } catch {}
            rememberStore(group.store, data.business_name)
            return {...group, business:data.business_name, delivery:Number(data.delivery_fee || 0), cart, pendingToken}
          }))
          if (active) setGroups(fresh)
        }
      } catch (e) {
        if (active) setError(e.message?.includes('temporarily') ? e.message : 'We couldn’t load the latest details. Please try again.')
      } finally {if (active) setLoading(false)}
    }, tab === 'shop' ? 250 : 0)
    return () => {active = false; clearTimeout(timer)}
  }, [tab, view, search, category, offset, retry, session?.user?.id])

  useEffect(() => {
    if (tab !== 'orders' || !session) return
    const refresh = () => {if (!document.hidden) setRetry(n => n + 1)}
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {clearInterval(timer); window.removeEventListener('focus', refresh)}
  }, [tab, session?.user?.id])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  function add(product) {
    const cart = readCart(product.merchant_id)
    const found = cart.find(row => row.product.id === product.id)
    const stock = Number(product.stock_quantity || 0)
    if ((found?.quantity || 0) >= stock) {setNotice('You have added all the available stock.'); return}
    writeCart(product.merchant_id, found ? cart.map(row => row.product.id === product.id ? {product, quantity:row.quantity + 1} : row) : [...cart, {product, quantity:1}])
    rememberStore(product.merchant_id, product.business_name)
    setNotice(`${product.name} added to your cart.`)
  }

  function adjust(group, productId, change, remove = false) {
    const updated = group.cart.map(row => {
      if (row.product.id !== productId) return row
      const quantity = remove ? 0 : Math.max(0, row.quantity + change)
      return {...row, quantity, unavailable:row.missing || row.product.active === false || quantity > Number(row.product.stock_quantity || 0)}
    }).filter(row => row.quantity > 0)
    writeCart(group.store, updated.map(({product, quantity}) => ({product, quantity})))
    setGroups(current => current.map(g => g.store === group.store ? {...g, cart:updated, pendingToken:''} : g).filter(g => g.cart.length))
  }

  return <main className="ux-market experience">
    <header className="ux-shop-header"><a href="/shop" className="ux-wordmark"><span className="ux-brand-mark"><i/><i/><i/></span>Order<span>Flow</span></a><div className="ux-header-actions">{authReady && !session && <a href="/buyer">Sign in</a>}<ThemeToggle/></div></header>
    <section className="ux-shop-content">
      {tab === 'shop' && <>
        <div className="ux-shop-intro"><span className="ux-eyebrow">Discover something you’ll love</span><h1>Good finds. Great stores.</h1><p>Explore products from independent vendors, all in one place.</p></div>
        <label className="ux-search"><Icon name="search"/><span className="ux-sr-only">Search products or vendors</span><input type="search" maxLength={120} placeholder="Search products or vendors…" value={search} onChange={e => {setSearch(e.target.value); setOffset(0)}}/>{search && <button aria-label="Clear search" onClick={() => {setSearch('');setOffset(0)}}>×</button>}</label>
        <div className="ux-categories" aria-label="Categories">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => {setCategory(c);setOffset(0)}}>{c || 'All'}</button>)}</div>
        <div className="ux-section-head ux-results-head"><h2>{search ? `Results for “${search}”` : category || 'Explore the catalogue'}</h2><div className="ux-segments" aria-label="Result type">{['products','stores'].map(v => <button key={v} aria-pressed={view === v} onClick={() => {setView(v);setOffset(0)}}>{v === 'products' ? 'Products' : 'Vendors'}</button>)}</div></div>
        {!loading && !error && (results.length ? <>
          {view === 'products' ? <div className="ux-product-grid">{results.map(product => <article className="ux-product" key={product.id}>
            <a className="ux-product-photo-link" href={`/?store=${product.merchant_id}&product=${product.id}`}><ProductPhoto product={product}/>{Number(product.stock_quantity) === 0 && <span className="ux-stock-label">Sold out</span>}</a>
            <div className="ux-product-copy"><a className="ux-product-vendor" href={`/?store=${product.merchant_id}`}>{product.business_name}</a><h3><a href={`/?store=${product.merchant_id}&product=${product.id}`}>{product.name}</a></h3><div className="ux-product-price"><strong>{money.format(product.price)}</strong>{Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= 5 && <small>{product.stock_quantity} left</small>}</div><button className="ux-add" disabled={Number(product.stock_quantity) === 0} onClick={() => add(product)}><Icon name="plus"/>{Number(product.stock_quantity) === 0 ? 'Unavailable' : 'Add to cart'}</button></div>
          </article>)}</div> : <div className="ux-vendor-grid">{results.map(store => <article className="ux-vendor" key={store.merchant_id}><a className="ux-vendor-photos" href={`/?store=${store.merchant_id}`}>{store.previews.map(p => <ProductPhoto key={p.id} product={p}/>)}</a><div><span><h3>{store.business_name}</h3><small>{store.product_count} products</small></span><a href={`/?store=${store.merchant_id}`}>Visit store <Icon name="arrow"/></a></div></article>)}</div>}
          {(offset > 0 || more) && <div className="ux-pagination"><button className="ux-secondary" disabled={!offset} onClick={() => {setOffset(n => Math.max(0,n-12));window.scrollTo(0,0)}}>Previous</button><span>Page {offset / 12 + 1}</span><button className="ux-secondary" disabled={!more} onClick={() => {setOffset(n => n+12);window.scrollTo(0,0)}}>Next</button></div>}
        </> : <EmptyState icon="search" title={search || category ? 'No matches this time' : 'The catalogue is getting started'}><p>{search || category ? 'Try another name or explore a different category.' : 'Products will appear as vendors publish them.'}</p>{(search || category) && <button className="ux-secondary" onClick={() => {setSearch('');setCategory('');setOffset(0)}}>Clear filters</button>}</EmptyState>)}
      </>}
      {tab === 'cart' && <><div className="ux-heading"><div><h1>Your cart</h1><p>A few good finds, ready when you are.</p></div><button className="ux-text" onClick={() => navigate('shop')}>Keep shopping <Icon name="arrow"/></button></div>{!loading && !error && (groups.length ? <><p className="ux-cart-explainer">Check out with each vendor separately. Delivery fees are shown for each store.</p><div className="ux-cart-groups">{groups.map(group => {
        const subtotal = group.cart.reduce((n,r) => n + Number(r.product.price) * r.quantity, 0)
        const blocked = group.unavailable || group.cart.some(row => row.unavailable)
        return <article className="ux-panel ux-cart-group" key={group.store}><div className="ux-section-head"><h2>{group.business}</h2><a href={`/?store=${group.store}`}>Visit store <Icon name="arrow"/></a></div>{group.cart.map(row => <div className="ux-cart-row" key={row.product.id}><ProductPhoto product={row.product}/><div><h3>{row.product.name}</h3><span>{money.format(row.product.price)}</span>{row.unavailable && !group.pendingToken && <small className="ux-error-text">Unavailable in this quantity. Reduce it or remove the item.</small>}<div className="ux-quantity"><button aria-label={`Reduce ${row.product.name} quantity`} onClick={() => adjust(group,row.product.id,-1)}>−</button><span>{row.quantity}</span><button disabled={row.unavailable || row.quantity >= Number(row.product.stock_quantity)} aria-label={`Increase ${row.product.name} quantity`} onClick={() => adjust(group,row.product.id,1)}>+</button></div></div><div><b>{money.format(Number(row.product.price)*row.quantity)}</b><button className="ux-text" onClick={() => adjust(group,row.product.id,0,true)}>Remove</button></div></div>)}<dl className="ux-totals"><div><dt>Subtotal</dt><dd>{money.format(subtotal)}</dd></div><div><dt>Delivery</dt><dd>{group.unavailable ? 'Unavailable' : group.delivery ? money.format(group.delivery) : 'Free'}</dd></div><div className="ux-total"><dt>Total</dt><dd>{group.unavailable ? '—' : money.format(subtotal+group.delivery)}</dd></div></dl>{group.pendingToken ? <><p className="ux-muted">An order is already saved for these items. Continue with that order to finish payment or check its status.</p><a className="ux-primary" href={`/?order=${encodeURIComponent(group.pendingToken)}`}>Resume order <Icon name="arrow"/></a></> : blocked ? <div role="status" className="notice"><p>{group.unavailable ? 'This store could not be reached. Please retry before checking out.' : 'Review the unavailable items above to continue.'}</p>{group.unavailable && <button className="ux-secondary" onClick={()=>setRetry(n=>n+1)}>Try again</button>}</div> : <a className="ux-primary" href={`/?store=${group.store}&view=checkout`}>Continue to checkout <Icon name="arrow"/></a>}</article>
      })}</div></> : <EmptyState icon="cart" title="Your cart is waiting"><p>Find something you like and add it here.</p><button onClick={() => navigate('shop')} className="ux-primary">Explore products</button></EmptyState>)}</>}
      {tab === 'orders' && <><div className="ux-heading"><div><h1>My orders</h1><p>Keep up with your purchases across stores.</p></div></div>{authReady && !session ? <EmptyState icon="orders" title="Keep your orders together"><p>Sign in to see your saved orders. You can also use the tracking link from your payment confirmation.</p><a className="ux-primary" href="/buyer?next=orders">Sign in</a></EmptyState> : !loading && !error && (orders.length ? <div className="ux-saved-orders">{orders.map(order => <a className="ux-saved-order" key={order.public_token} href={`/?track=${order.public_token}`}><span className="ux-order-symbol"><Icon name="box"/></span><span><h3>{order.business_name}</h3><small className="ux-order-id">{order.order_number}</small><small>{new Date(order.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</small></span><span><StatusBadge status={order.status}/><small>Track order <Icon name="arrow"/></small></span></a>)}</div> : <EmptyState icon="orders" title="Your first order starts here"><p>Orders you place while signed in, or save using a tracking link, will appear here.</p><button className="ux-primary" onClick={() => navigate('shop')}>Explore products</button></EmptyState>)}</>}
      {tab === 'account' && <div className="ux-account"><span className="ux-empty-icon"><Icon name="account"/></span><h1>{session ? 'Your account' : 'Make yourself at home'}</h1>{!authReady ? <p role="status">Loading your account…</p> : session ? <><p>{session.user.email}</p><button className="ux-secondary" onClick={() => navigate('orders')}>View my orders <Icon name="arrow"/></button><button className="ux-secondary" onClick={() => navigate('cart')}>Open my cart <Icon name="cart"/></button><button className="ux-text" onClick={async () => {const {error}=await supabase.auth.signOut();if(error)setError('Could not sign out. Please try again.');else{setSession(null);setOrders([])}}}>Sign out</button></> : <><p>Sign in to save your orders and pick up where you left off.</p><a className="ux-primary" href="/buyer">Sign in</a><a className="ux-secondary" href="/buyer?mode=signup">Create buyer account</a><button className="ux-text" onClick={() => navigate('shop')}>Continue browsing</button></>}<div className="ux-account-merchant"><p>Running a business?</p><a href="/">Open merchant workspace <Icon name="arrow"/></a></div></div>}
      {loading && tab !== 'account' && <div role="status" className="ux-loading"><span className="ux-spinner"/>Loading {tab === 'shop' ? 'the catalogue' : tab === 'cart' ? 'your latest cart details' : 'your orders'}…</div>}
      {error && <div role="alert" className="ux-error"><p>{error}</p><button className="ux-secondary" onClick={() => setRetry(n=>n+1)}>Try again</button></div>}
    </section>
    {notice && <div className="ux-toast" role="status"><Icon name="check"/>{notice}<button onClick={() => navigate('cart')}>View cart</button></div>}
    <BuyerNav active={tab} count={count} onNavigate={navigate}/>
  </main>
}
