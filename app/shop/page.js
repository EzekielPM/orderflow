'use client'

import {useEffect, useRef, useState} from 'react'
import {supabase} from '../../lib/supabase'
import {readCart, writeCart, readAllCarts, rememberStore} from '../../lib/buyer-context'
import {Icon, ThemeToggle, ProductPhoto, BuyerNav, EmptyState, StatusBadge, money, ProtectedPaymentsLink} from '../experience'
import styles from './catalogue.module.css'

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
  const [cartQuantities, setCartQuantities] = useState({})
  const [locationReady, setLocationReady] = useState(false)
  const [notice, setNotice] = useState('')
  const requestVersion = useRef(0)

  function changeView(next) {
    if (next === view) return
    // Clear the previous result shape before rendering the other view.
    // Invalidate any in-flight request before the effect starts its replacement.
    requestVersion.current += 1
    setLoading(true); setResults([]); setMore(false); setError('')
    setView(next); setOffset(0)
  }

  function navigate(next) {
    if (next === tab) {window.scrollTo(0, 0); return}
    requestVersion.current += 1
    setLoading(true)
    setTab(next); setError(''); setNotice('')
    const url = new URL(window.location.href)
    if (next === 'shop') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.pushState({}, '', `${url.pathname}${url.search}`)
    window.scrollTo(0, 0)
  }

  function updateFilters(nextSearch = search, nextCategory = category, nextOffset = 0) {
    requestVersion.current += 1
    setLoading(true); setResults([]); setMore(false); setError('')
    setSearch(nextSearch); setCategory(nextCategory); setOffset(nextOffset)
  }

  useEffect(() => {
    const syncTab = () => {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('tab')
      const page = Number(params.get('page') || 1)
      requestVersion.current += 1
      setLoading(true); setResults([]); setMore(false); setError('')
      setTab(tabs.includes(next) ? next : 'shop')
      setView(params.get('view') === 'stores' ? 'stores' : 'products')
      setSearch((params.get('q') || '').slice(0, 120))
      setCategory(categories.includes(params.get('category')) ? params.get('category') : '')
      setOffset(Number.isSafeInteger(page) && page > 0 && page < 100000 ? (page - 1) * 12 : 0)
      setLocationReady(true)
    }
    const syncCount = () => {
      const carts = readAllCarts()
      const quantities = {}
      carts.forEach(group => group.cart.forEach(row => {
        quantities[`${group.store}:${row.product.id}`] = row.quantity
      }))
      setCartQuantities(quantities)
      setCount(carts.reduce((sum, group) => sum + group.cart.reduce((n, row) => n + row.quantity, 0), 0))
    }
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
    if (!locationReady) return
    // Retain filters on reload and when the buyer returns from a product or store.
    const params = new URLSearchParams()
    if (tab !== 'shop') params.set('tab', tab)
    if (view === 'stores') params.set('view', view)
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (offset) params.set('page', String(offset / 12 + 1))
    window.history.replaceState(window.history.state, '', `/shop${params.size ? `?${params}` : ''}`)
  }, [locationReady, tab, view, search, category, offset])

  useEffect(() => {
    if (!locationReady) return
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
          if (active && version === requestVersion.current) setOrders(data || [])
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
          if (active && version === requestVersion.current) setGroups(fresh)
        }
      } catch (e) {
        if (active && version === requestVersion.current) setError(e.message?.includes('temporarily') ? e.message : 'We couldn’t load the latest details. Please try again.')
      } finally {if (active && version === requestVersion.current) setLoading(false)}
    }, tab === 'shop' ? 250 : 0)
    return () => {active = false; clearTimeout(timer)}
  }, [locationReady, tab, view, search, category, offset, retry, session?.user?.id])

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
    rememberStore(product.merchant_id, product.business_name)
    writeCart(product.merchant_id, found ? cart.map(row => row.product.id === product.id ? {product, quantity:row.quantity + 1} : row) : [...cart, {product, quantity:1}])
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

  return <main className={`ux-market experience ${styles.market}`}>
    <a className={styles.skipLink} href="#shop-content">Skip to content</a>
    <header className="ux-shop-header">
      <a href="/shop" className="ux-wordmark" aria-label="OrderFlow shop"><span className="ux-brand-mark" aria-hidden="true"><i/><i/><i/></span>Order<span>Flow</span></a>
      <BuyerNav active={tab} count={count} onNavigate={navigate}/>
      <div className="ux-header-actions">{authReady && !session && <a href="/buyer">Sign in</a>}<ThemeToggle/></div>
    </header>
    <section id="shop-content" tabIndex={-1} className="ux-shop-content">
      {tab === 'shop' && <>
        <div className={styles.intro}><h1>Find your next favourite.</h1><p>Products and independent stores, in one place.</p></div>
        <div className={styles.searchRow} role="search">
          <div className={styles.searchBox}><Icon name="search"/><label className="ux-sr-only" htmlFor="catalogue-search">{view === 'products' ? 'Search products or vendors' : 'Search vendors'}</label><input id="catalogue-search" type="search" maxLength={120} placeholder={view === 'products' ? 'Search products or vendors' : 'Search vendors'} value={search} onChange={e => updateFilters(e.target.value)}/>{search && <button aria-label="Clear search" onClick={() => updateFilters('')}>×</button>}</div>
          <label className={styles.category}><span className="ux-sr-only">Category</span><select value={category} onChange={e => updateFilters(search, e.target.value)}>{categories.map(c => <option key={c} value={c}>{c || 'All categories'}</option>)}</select></label>
        </div>
        {count > 0 && <button className={styles.resumeCart} onClick={() => navigate('cart')}><span className={styles.resumeIcon}><Icon name="cart"/></span><span><strong>Pick up where you left off</strong><small>{count} {count === 1 ? 'item' : 'items'} in your cart</small></span><span className={styles.resumeAction}>View cart <Icon name="arrow"/></span></button>}
        <div className={styles.browseBar}>
          <div className={styles.views} role="group" aria-label="Browse by">{['products','stores'].map(v => <button key={v} aria-pressed={view === v} onClick={() => changeView(v)}>{v === 'products' ? 'Products' : 'Vendors'}</button>)}</div>
          {(search || category) && <button className={styles.clearFilters} onClick={() => updateFilters('', '')}>Clear filters</button>}
        </div>
        <h2 className={search || category ? styles.resultTitle : 'ux-sr-only'}>{search ? `Results for “${search}”` : category || (view === 'products' ? 'Browse products' : 'Browse vendors')}</h2>
        {!loading && !error && (results.length ? <>
          {view === 'products' ? <div className="ux-product-grid">{results.map(product => {
            const quantity = cartQuantities[`${product.merchant_id}:${product.id}`] || 0
            const soldOut = Number(product.stock_quantity || 0) <= 0
            return <article className="ux-product" key={product.id}>
              <a className="ux-product-photo-link" tabIndex={-1} aria-hidden="true" href={`/?store=${product.merchant_id}&product=${product.id}`}><ProductPhoto product={product}/>{soldOut && <span className="ux-stock-label">Sold out</span>}</a>
              <div className="ux-product-copy">
                <h3><a href={`/?store=${product.merchant_id}&product=${product.id}`}>{product.name}</a></h3>
                <a className="ux-product-vendor" href={`/?store=${product.merchant_id}`}>{product.business_name}</a>
                <div className="ux-product-price"><strong>{money.format(product.price)}</strong>{soldOut && <span className="ux-sr-only">Sold out</span>}</div>
                <button className="ux-add" data-in-cart={quantity > 0} disabled={soldOut && !quantity} aria-label={quantity ? `View cart, ${quantity} ${product.name} in cart` : `Add ${product.name} to cart`} onClick={() => quantity ? navigate('cart') : add(product)}><Icon name={quantity ? 'check' : 'plus'}/>{quantity ? `In cart · ${quantity}` : soldOut ? 'Sold out' : 'Add to cart'}</button>
              </div>
            </article>
          })}</div> : <div className="ux-vendor-grid">{results.map(store => <article className="ux-vendor" key={store.merchant_id}><a className="ux-vendor-photos" tabIndex={-1} aria-hidden="true" href={`/?store=${store.merchant_id}`}>{(Array.isArray(store.previews) ? store.previews : []).slice(0,3).map(p => <ProductPhoto key={p.id} product={p}/>)}</a><div><span><h3>{store.business_name}</h3><small>{store.product_count} {Number(store.product_count) === 1 ? 'product' : 'products'}</small></span><a href={`/?store=${store.merchant_id}`} aria-label={`Visit ${store.business_name} store`}>Visit store <Icon name="arrow"/></a></div></article>)}</div>}
        </> : <EmptyState icon="search" title={search || category ? 'No matches yet' : 'New products are on the way'}><p>{search || category ? 'Try a different name or category.' : 'Come back as more vendors add their products.'}</p>{(search || category) && <button className="ux-secondary" onClick={() => updateFilters('', '')}>Browse everything</button>}</EmptyState>)}
        {!loading && !error && (offset > 0 || more) && <nav aria-label="Catalogue pages" className="ux-pagination"><button className="ux-secondary" disabled={!offset} onClick={() => {updateFilters(search, category, Math.max(0, offset-12));window.scrollTo(0,0)}}>Previous</button><span>Page {offset / 12 + 1}</span><button className="ux-secondary" disabled={!more} onClick={() => {updateFilters(search, category, offset+12);window.scrollTo(0,0)}}>Next</button></nav>}
      </>}
      {tab === 'cart' && <><div className="ux-heading"><div><h1>Your cart</h1><p>A few good finds, ready when you are.</p></div><button className="ux-text" onClick={() => navigate('shop')}>Keep shopping <Icon name="arrow"/></button></div>{!loading && !error && (groups.length ? <><p className="ux-cart-explainer">Check out with each vendor separately. Delivery fees are shown for each store.</p><div className="ux-cart-groups">{groups.map(group => {
        const subtotal = group.cart.reduce((n,r) => n + Number(r.product.price) * r.quantity, 0)
        const blocked = group.unavailable || group.cart.some(row => row.unavailable)
        return <article className="ux-panel ux-cart-group" key={group.store}><div className="ux-section-head"><h2>{group.business}</h2><a href={`/?store=${group.store}`}>Visit store <Icon name="arrow"/></a></div>{group.cart.map(row => <div className="ux-cart-row" key={row.product.id}><ProductPhoto product={row.product}/><div><h3>{row.product.name}</h3><span>{money.format(row.product.price)}</span>{row.unavailable && !group.pendingToken && <small className="ux-error-text">Unavailable in this quantity. Reduce it or remove the item.</small>}<div className="ux-quantity"><button aria-label={`Reduce ${row.product.name} quantity`} onClick={() => adjust(group,row.product.id,-1)}>−</button><span>{row.quantity}</span><button disabled={row.unavailable || row.quantity >= Number(row.product.stock_quantity)} aria-label={`Increase ${row.product.name} quantity`} onClick={() => adjust(group,row.product.id,1)}>+</button></div></div><div><b>{money.format(Number(row.product.price)*row.quantity)}</b><button className="ux-text" onClick={() => adjust(group,row.product.id,0,true)}>Remove</button></div></div>)}<dl className="ux-totals"><div><dt>Subtotal</dt><dd>{money.format(subtotal)}</dd></div><div><dt>Delivery</dt><dd>{group.unavailable ? 'Unavailable' : group.delivery ? money.format(group.delivery) : 'Free'}</dd></div><div className="ux-total"><dt>Total</dt><dd>{group.unavailable ? '—' : money.format(subtotal+group.delivery)}</dd></div></dl>{group.pendingToken ? <><p className="ux-muted">An order is already saved for these items. Continue with that order to finish payment or check its status.</p><a className="ux-primary" href={`/?order=${encodeURIComponent(group.pendingToken)}`}>Resume order <Icon name="arrow"/></a></> : blocked ? <div role="status" className="notice"><p>{group.unavailable ? 'This store could not be reached. Please retry before checking out.' : 'Review the unavailable items above to continue.'}</p>{group.unavailable && <button className="ux-secondary" onClick={()=>setRetry(n=>n+1)}>Try again</button>}</div> : <a className="ux-primary" href={`/?store=${group.store}&view=checkout`}>Continue to checkout <Icon name="arrow"/></a>}</article>
      })}</div></> : <EmptyState icon="cart" title="Your cart is waiting"><p>Find something you like and add it here.</p><button onClick={() => navigate('shop')} className="ux-primary">Explore products</button></EmptyState>)}</>}
      {tab === 'orders' && <><div className="ux-heading"><div><h1>My orders</h1><p>Keep up with your purchases across stores.</p></div></div>{session && <div className="ux-protection-entry"><ProtectedPaymentsLink/><p className="ux-muted">Confirm receipt or report an issue for a protected order.</p></div>}{authReady && !session ? <EmptyState icon="orders" title="Keep your orders together"><p>Sign in to see your saved orders. You can also use the tracking link from your payment confirmation.</p><a className="ux-primary" href="/buyer?next=orders">Sign in</a></EmptyState> : !loading && !error && (orders.length ? <div className="ux-saved-orders">{orders.map(order => <a className="ux-saved-order" key={order.public_token} href={`/?track=${order.public_token}`}><span className="ux-order-symbol"><Icon name="box"/></span><span><h3>{order.business_name}</h3><small className="ux-order-id">{order.order_number}</small><small>{new Date(order.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</small></span><span><StatusBadge status={order.status}/><small>Track order <Icon name="arrow"/></small></span></a>)}</div> : <EmptyState icon="orders" title="Your first order starts here"><p>Orders you place while signed in, or save using a tracking link, will appear here.</p><button className="ux-primary" onClick={() => navigate('shop')}>Explore products</button></EmptyState>)}</>}
      {tab === 'account' && <div className="ux-account"><span className="ux-empty-icon"><Icon name="account"/></span><h1>{session ? 'Your account' : 'Make yourself at home'}</h1>{!authReady ? <p role="status">Loading your account…</p> : session ? <><p>{session.user.email}</p><button className="ux-secondary" onClick={() => navigate('orders')}>View my orders <Icon name="arrow"/></button><ProtectedPaymentsLink/><button className="ux-secondary" onClick={() => navigate('cart')}>Open my cart <Icon name="cart"/></button><button className="ux-text" onClick={async () => {const {error}=await supabase.auth.signOut();if(error)setError('Could not sign out. Please try again.');else{setSession(null);setOrders([])}}}>Sign out</button></> : <><p>Sign in to save your orders and pick up where you left off.</p><a className="ux-primary" href="/buyer">Sign in</a><a className="ux-secondary" href="/buyer?mode=signup">Create buyer account</a><button className="ux-text" onClick={() => navigate('shop')}>Continue browsing</button></>}<div className="ux-account-merchant"><p>Running a business?</p><a href="/">Open merchant workspace <Icon name="arrow"/></a></div></div>}
      {loading && tab === 'shop' && <div role="status"><span className="ux-sr-only">Loading {view === 'products' ? 'products' : 'vendors'}…</span><div className={view === 'products' ? 'ux-product-grid' : 'ux-vendor-grid'} aria-hidden="true">{Array.from({length:view === 'products' ? 4 : 2}, (_, i) => <div className={styles.skeleton} key={i}><div/><span/><span/><span/></div>)}</div></div>}
      {loading && tab !== 'account' && tab !== 'shop' && <div role="status" className="ux-loading"><span className="ux-spinner"/>Loading {tab === 'cart' ? 'your latest cart details' : 'your orders'}…</div>}
      {error && <div role="alert" className="ux-error"><p>{error}</p><button className="ux-secondary" onClick={() => setRetry(n=>n+1)}>Try again</button></div>}
    </section>
    {notice && <div className="ux-toast" role="status"><Icon name="check"/>{notice}<button onClick={() => navigate('cart')}>View cart</button></div>}
  </main>
}
