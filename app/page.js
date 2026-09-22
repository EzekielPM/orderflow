'use client'

import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const seedOrders = [
  { id: 'OF-1024', name: 'Ada Okafor', item: 'Leather handbag', qty: 1, amount: 18500, channel: 'Instagram', status: 'Pending', createdAt: '2026-09-21T10:42:00+01:00' },
  { id: 'OF-1023', name: 'Tunde Bello', item: 'Wireless earbuds', qty: 1, amount: 7000, channel: 'WhatsApp', status: 'Confirmed', createdAt: '2026-09-20T16:18:00+01:00' },
  { id: 'OF-1022', name: 'Mariam Musa', item: 'Skincare bundle', qty: 3, amount: 31200, channel: 'WhatsApp', status: 'Delivered', createdAt: '2026-09-12T14:05:00+01:00' },
]

const seedProducts = [
  { id: 'sample-1', name: 'Classic handbag', description: 'A polished everyday carry.', price: 28000, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80', active: true },
  { id: 'sample-2', name: 'Glow skincare set', description: 'A simple daily care bundle.', price: 24500, category: 'Beauty', image_url: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80', active: true },
]

function AppShell({ children, back, title, onBack, merchantHeader = false, merchantName = '', onNotifications, onProfile }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('orderflow-theme')
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const nextTheme = savedTheme || preferred
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('orderflow-theme', nextTheme)
  }

  return (
    <main className="phone">
      <header className={`topbar${merchantHeader ? ' merchant-topbar' : ''}`}>
        {merchantHeader ? (
          <>
            <OrderFlowLogo compact />
            <div className="topbar-actions">
              <button className="notification-button" onClick={onNotifications} aria-label="Open notifications"><BellIcon /><span /></button>
              <button className="avatar avatar-button" onClick={onProfile} aria-label="Open profile">{merchantName.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase() || 'OF'}</button>
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span aria-hidden="true">{theme === 'dark' ? '☀' : '◐'}</span></button>
            </div>
          </>
        ) : (
          <>
            {back ? <button className="icon back-button" onClick={() => onBack(back)} aria-label="Go back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /></svg></button> : <span />}
            {title && <strong>{title}</strong>}
            <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span aria-hidden="true">{theme === 'dark' ? '☀' : '◐'}</span></button>
          </>
        )}
      </header>
      {children}
    </main>
  )
}

function OrderFlowLogo({ compact = false }) {
  return <div className={`orderflow-logo${compact ? ' compact' : ''}`} aria-label="OrderFlow"><span className="logo-symbol"><i /><i /><i /></span><strong>Order<span>Flow</span></strong></div>
}

function ScreenAccent({ type = 'orders' }) {
  return <div className={`screen-accent ${type}`} aria-hidden="true"><span /><span /><span /></div>
}

function CommerceBanner() {
  return <div className="commerce-banner" aria-hidden="true">
    <div className="commerce-copy"><small>Everything in one place</small><strong>Sell. Share. Get paid.</strong><span>From order to delivery</span></div>
    <div className="banner-photo commerce-photo" />
  </div>
}

function FeatureBanner({ type }) {
  if (type === 'buyers') return <div className="feature-banner buyers-banner" aria-hidden="true">
    <div><small>Customer directory</small><strong>Know your buyers</strong><span>Find repeat customers and order history.</span></div>
    <div className="banner-photo buyers-photo" />
  </div>
  return <div className="feature-banner profile-banner" aria-hidden="true">
    <div><small>Business workspace</small><strong>Your store identity</strong><span>Keep your contact and business details current.</span></div>
    <div className="banner-photo profile-photo" />
  </div>
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function GoogleIcon() {
  return <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.04v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.38 13.92A6 6 0 0 1 6.07 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.34-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.34 2.61C7.17 7.71 9.39 5.95 12 5.95Z"/></svg>
}

function NavIcon({ type }) {
  const paths = {
    dashboard: <><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    products: <><path d="M4 7h16l-1 13H5L4 7Z"/><path d="M8 7a4 4 0 0 1 8 0"/></>,
    buyers: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20c.5-4 2.8-6 6-6s5.5 2 6 6M15 15c3 0 5 1.7 6 5"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.6-8 8-8s7.3 3 8 8"/></>,
  }
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
}

function MerchantNav({ active, onNavigate }) {
  const items = [
    ['dashboard', 'Home'],
    ['orders', 'Orders'],
    ['products', 'Products'],
    ['buyers', 'Buyers'],
    ['profile', 'Profile'],
  ]

  return (
    <nav aria-label="Merchant navigation">
      {items.map(([screen, label]) => (
        <button
          key={screen}
          className={active === screen || (screen === 'orders' && active === 'merchant-order') ? 'active' : ''}
          onClick={() => onNavigate(screen)}
        >
          <NavIcon type={screen} /><span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
const orderDate = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const trackingSteps = ['Confirmed', 'Payment received', 'Out for delivery', 'Delivered']

const trackingCopy = {
  Pending: ['Order awaiting confirmation', 'The seller will confirm your order shortly.'],
  Confirmed: ['Order confirmed', 'Your order details have been confirmed.'],
  'Payment received': ['Payment received', 'Your payment has been confirmed securely.'],
  'Out for delivery': ['Your order is on the way', 'Your package is currently out for delivery.'],
  Delivered: ['Order delivered', 'Your order has reached its destination.'],
  Cancelled: ['Order cancelled', 'Contact the seller if you need more information.'],
}

export default function Home() {
  const [screen, setScreen] = useState('splash')
  const [merchant, setMerchant] = useState({ name: 'Ezekiel', business: 'Ezekiel Stores', phone: '', email: '' })
  const [orders, setOrders] = useState(seedOrders)
  const [draft, setDraft] = useState({ name: '', phone: '', email: '', item: '', qty: 1, price: '', delivery: '', address: '' })
  const [selected, setSelected] = useState(seedOrders[0])
  const [notice, setNotice] = useState('')
  const [session, setSession] = useState(null)
  const [auth, setAuth] = useState({ name: '', email: '', password: '' })
  const [authBusy, setAuthBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('paystack')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [publicOrderLoading, setPublicOrderLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('All')
  const [editingOrder, setEditingOrder] = useState(null)
  const [products, setProducts] = useState(seedProducts)
  const [productDraft, setProductDraft] = useState({ name: '', description: '', price: '', category: 'Fashion', image: null })
  const [productBusy, setProductBusy] = useState(false)
  const [cart, setCart] = useState([])
  const [storeSearch, setStoreSearch] = useState('')
  const [storeMerchantId, setStoreMerchantId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('orderflow-state')
    if (saved) {
      try { const parsed = JSON.parse(saved); setOrders(parsed.orders || seedOrders); setMerchant(parsed.merchant || merchant) } catch {}
    }
    const rememberedEmail = localStorage.getItem('orderflow-remembered-email')
    if (rememberedEmail) setAuth(current => ({ ...current, email: rememberedEmail }))
    const params = new URLSearchParams(window.location.search)
    const hasPaymentReturn = params.has('reference')
    const hasPublicOrder = params.has('order') || params.has('track') || params.has('store')
    const timer = hasPaymentReturn || hasPublicOrder
      ? null
      : setTimeout(() => setScreen(current => current === 'splash' ? 'welcome' : current), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const merchantId = new URLSearchParams(window.location.search).get('store')
    if (!merchantId) return
    setStoreMerchantId(merchantId)
    setScreen('public-loading')
    if (!supabase) {
      setProducts(seedProducts)
      setScreen('store')
      return
    }
    supabase.rpc('get_public_store', { p_merchant: merchantId }).maybeSingle().then(({ data, error }) => {
      if (error || !data) {
        setNotice('This storefront is unavailable.')
        setScreen('public-error')
        return
      }
      setMerchant(current => ({ ...current, business: data.business_name || 'OrderFlow Store', phone: data.phone || '' }))
      setProducts(Array.isArray(data.products) ? data.products : [])
      setScreen('store')
    })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const trackingToken = params.get('track')
    const token = params.get('order') || trackingToken
    if (!token) return
    if (params.has('reference')) return
    if (!supabase) {
      setScreen('public-error')
      setNotice('This order link cannot be opened until Supabase is connected.')
      return
    }
    setPublicOrderLoading(true)
    setScreen('public-loading')
    Promise.all([
      supabase.rpc('get_public_order', { p_token: token }).maybeSingle(),
      trackingToken ? supabase.rpc('get_public_order_tracking', { p_token: token }).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ])
      .then(([orderResult, trackingResult]) => {
        const { data, error } = orderResult
        if (error || !data) {
          setNotice('This order link is invalid or no longer available.')
          setScreen('public-error')
          return
        }
        const liveStatus = trackingResult.data
        setSelected({ id: data.order_number, publicToken: token, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, unitPrice: Number(data.unit_price), deliveryFee: Number(data.delivery_fee), amount: Number(data.unit_price) * Number(data.quantity) + Number(data.delivery_fee), address: data.delivery_address, status: liveStatus?.status || data.status, createdAt: data.created_at, updatedAt: liveStatus?.updated_at, paymentStatus: liveStatus?.payment_status })
        setDraft(current => ({ ...current, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, price: String(data.unit_price), delivery: String(data.delivery_fee), address: data.delivery_address || '' }))
        setMerchant(current => ({ ...current, business: data.merchant_business || 'OrderFlow merchant', phone: liveStatus?.merchant_phone || current.phone }))
        setScreen(trackingToken ? 'tracking' : 'confirm')
      })
      .finally(() => setPublicOrderLoading(false))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference')
    if (!reference) return
    const savedBuyerOrder = sessionStorage.getItem('orderflow-buyer-order')
    if (savedBuyerOrder) {
      try {
        const parsed = JSON.parse(savedBuyerOrder)
        if (parsed.selected) setSelected(parsed.selected)
        if (parsed.draft) setDraft(parsed.draft)
        if (parsed.merchant) setMerchant(current => ({ ...current, ...parsed.merchant }))
        if (parsed.storeMerchantId) setStoreMerchantId(parsed.storeMerchantId)
        if (parsed.cart) setCart(parsed.cart)
      } catch {}
    }
    setPaymentBusy(true)
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(response => response.json())
      .then(async result => {
        if (!result.paid) {
          setScreen('payment')
          setNotice(result.message || 'Payment could not be verified.')
          return
        }
        if (result.merchantId) setStoreMerchantId(result.merchantId)
        if (supabase && result.orderToken) {
          const [{ data: orderData }, { data: trackingData }] = await Promise.all([
            supabase.rpc('get_public_order', { p_token: result.orderToken }).maybeSingle(),
            supabase.rpc('get_public_order_tracking', { p_token: result.orderToken }).maybeSingle(),
          ])
          if (orderData) {
            const paidOrder = { id: orderData.order_number, publicToken: result.orderToken, name: orderData.customer_name, phone: orderData.customer_phone, item: orderData.item_name, qty: orderData.quantity, unitPrice: Number(orderData.unit_price), deliveryFee: Number(orderData.delivery_fee), amount: Number(orderData.unit_price) * Number(orderData.quantity) + Number(orderData.delivery_fee), address: orderData.delivery_address, status: trackingData?.status || 'Payment received', createdAt: orderData.created_at, updatedAt: trackingData?.updated_at, paymentStatus: trackingData?.payment_status || 'paid' }
            setSelected(paidOrder)
            setDraft(current => ({ ...current, name: orderData.customer_name, phone: orderData.customer_phone, item: orderData.item_name, qty: orderData.quantity, price: String(orderData.unit_price), delivery: String(orderData.delivery_fee), address: orderData.delivery_address || '' }))
            setMerchant(current => ({ ...current, business: orderData.merchant_business || current.business, phone: trackingData?.merchant_phone || current.phone }))
          }
        }
        setScreen('paid')
      })
      .catch(() => { setScreen('payment'); setNotice('Payment verification failed. Please try again.') })
      .finally(() => {
        setPaymentBusy(false)
        window.history.replaceState({}, '', window.location.pathname)
      })
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
      const params = new URLSearchParams(window.location.search)
      const isPublicFlow = params.has('order') || params.has('track') || params.has('reference') || params.has('store')
      const [{ data: profile }, { data: savedOrders }, { data: savedProducts }] = await Promise.all([
        supabase.from('profiles').select('full_name,business_name,phone').eq('id', session.user.id).maybeSingle(),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ])
      const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      if (profile) {
        setMerchant(current => ({ ...current, name: profile.full_name || googleName || 'Merchant', business: profile.business_name || 'My Store', phone: profile.phone || '', email: session.user.email || '' }))
      } else {
        setMerchant(current => ({ ...current, name: googleName || 'Merchant', email: session.user.email || '' }))
      }
      if (savedOrders) setOrders(savedOrders.map(order => ({
        id: order.order_number,
        databaseId: order.id,
        name: order.customer_name,
        phone: order.customer_phone,
        item: order.item_name,
        qty: order.quantity,
        amount: Number(order.unit_price) * order.quantity + Number(order.delivery_fee),
        channel: order.channel,
        status: order.status,
        createdAt: order.created_at,
        publicToken: order.public_token,
        unitPrice: Number(order.unit_price),
        deliveryFee: Number(order.delivery_fee),
        address: order.delivery_address,
      })))
      if (savedProducts) setProducts(savedProducts)
      if (!isPublicFlow) {
        if (window.location.hash) window.history.replaceState({}, '', window.location.pathname)
        setScreen(profile?.business_name ? 'dashboard' : 'setup')
      }
    }
    loadAccount()
  }, [session])

  useEffect(() => {
    localStorage.setItem('orderflow-state', JSON.stringify({ orders, merchant }))
  }, [orders, merchant])

  const total = useMemo(() => Number(draft.price || 0) * Number(draft.qty || 1) + Number(draft.delivery || 0), [draft])
  const orderStats = useMemo(() => ({
    awaiting: orders.filter(order => order.status === 'Pending').length,
    active: orders.filter(order => ['Confirmed', 'Payment received', 'Out for delivery'].includes(order.status)).length,
    issues: orders.filter(order => order.status === 'Cancelled').length,
  }), [orders])
  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    return orders.filter(order => {
      const matchesSearch = !query || [order.id, order.name, order.phone, order.item].some(value => String(value || '').toLowerCase().includes(query))
      const matchesFilter = orderFilter === 'All' || (orderFilter === 'Paid' ? order.status === 'Payment received' : order.status === orderFilter)
      return matchesSearch && matchesFilter
    })
  }, [orders, orderSearch, orderFilter])
  const visibleProducts = useMemo(() => products.filter(product => product.active !== false && (!storeSearch.trim() || [product.name, product.category].some(value => String(value || '').toLowerCase().includes(storeSearch.trim().toLowerCase())))), [products, storeSearch])
  const cartTotal = useMemo(() => cart.reduce((sum, entry) => sum + Number(entry.product.price) * entry.quantity, 0), [cart])
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
    if (rememberMe) localStorage.setItem('orderflow-remembered-email', auth.email)
    else localStorage.removeItem('orderflow-remembered-email')
    go('dashboard')
  }

  const signInWithGoogle = async () => {
    if (!supabase) return setNotice('Connect Supabase to activate Google sign-in.')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setNotice(error.message)
  }

  const resetPassword = async () => {
    if (!auth.email) return setNotice('Enter your email address first, then tap Forgot password?')
    if (!supabase) return setNotice('Password reset becomes available when Supabase is connected.')
    setAuthBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(auth.email, { redirectTo: window.location.origin })
    setAuthBusy(false)
    setNotice(error ? error.message : 'Password reset link sent. Check your email.')
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
      const savedOrder = { id: data.order_number, databaseId: data.id, publicToken: data.public_token, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, unitPrice: Number(data.unit_price), deliveryFee: Number(data.delivery_fee), amount: total, channel: data.channel, status: data.status, createdAt: data.created_at || new Date().toISOString() }
      setSelected(savedOrder)
      setOrders(current => [savedOrder, ...current.filter(order => order.id !== savedOrder.id)])
    }
    go('link')
  }

  const confirmBuyerOrder = async () => {
    if (supabase && selected?.publicToken) {
      const { data, error } = await supabase.rpc('confirm_public_order', { p_token: selected.publicToken })
      if (error) return setNotice('We could not confirm this order. Please try again.')
      if (!data && selected.status !== 'Confirmed') return setNotice('This order can no longer be confirmed.')
      setSelected(current => ({ ...current, status: 'Confirmed' }))
    }
    go('delivery')
  }

  const updateOrderStatus = async () => {
    const updatedAt = new Date().toISOString()
    if (supabase && session && selected.databaseId) {
      const { error } = await supabase.from('orders').update({ status: selected.status, updated_at: updatedAt }).eq('id', selected.databaseId)
      if (error) return setNotice(error.message)
    }
    const updated = { ...selected, updatedAt }
    setSelected(updated)
    setOrders(orders.map(order => order.id === selected.id ? updated : order))
    setNotice('Order status updated')
  }

  const refreshTracking = async () => {
    if (!supabase || !selected?.publicToken) return setNotice('This order does not have a secure tracking link.')
    setPublicOrderLoading(true)
    setNotice('')
    const { data, error } = await supabase.rpc('get_public_order_tracking', { p_token: selected.publicToken }).maybeSingle()
    setPublicOrderLoading(false)
    if (error || !data) return setNotice('The latest status could not be loaded. Please try again.')
    setSelected(current => ({ ...current, status: data.status, updatedAt: data.updated_at, paymentStatus: data.payment_status }))
    setMerchant(current => ({ ...current, phone: data.merchant_phone || current.phone }))
    setNotice('Order status refreshed')
  }

  const openTracking = () => {
    if (selected?.publicToken) {
      window.history.replaceState({}, '', `/?track=${encodeURIComponent(selected.publicToken)}`)
    }
    go('tracking')
    setTimeout(refreshTracking, 0)
  }

  const contactSeller = () => {
    const phone = String(merchant.phone || '').replace(/\D/g, '').replace(/^0/, '234')
    if (!phone) return setNotice('The seller has not added a WhatsApp number yet.')
    const message = encodeURIComponent(`Hello, I am contacting you about OrderFlow order ${selected?.id || ''}.`)
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const openOrderEditor = () => {
    setEditingOrder({
      ...selected,
      unitPrice: Number(selected.unitPrice ?? Math.max(Number(selected.amount || 0) - Number(selected.deliveryFee || 3500), 0) / Number(selected.qty || 1)),
      deliveryFee: Number(selected.deliveryFee ?? 3500),
    })
    go('edit-order')
  }

  const saveOrderEdits = async () => {
    const quantity = Math.max(1, Number(editingOrder.qty || 1))
    const unitPrice = Math.max(0, Number(editingOrder.unitPrice || 0))
    const deliveryFee = Math.max(0, Number(editingOrder.deliveryFee || 0))
    if (!editingOrder.name?.trim() || !editingOrder.item?.trim()) return setNotice('Customer name and item are required.')
    if (supabase && session && editingOrder.databaseId) {
      const { error } = await supabase.from('orders').update({ customer_name: editingOrder.name.trim(), customer_phone: editingOrder.phone || '', item_name: editingOrder.item.trim(), quantity, unit_price: unitPrice, delivery_fee: deliveryFee, updated_at: new Date().toISOString() }).eq('id', editingOrder.databaseId)
      if (error) return setNotice(error.message)
    }
    const updated = { ...editingOrder, qty: quantity, unitPrice, deliveryFee, amount: unitPrice * quantity + deliveryFee }
    setSelected(updated)
    setOrders(current => current.map(order => order.id === updated.id ? updated : order))
    setEditingOrder(null)
    go('merchant-order')
  }

  const cancelOrder = async () => {
    if (!window.confirm(`Cancel order ${selected.id}? This action will be shown to the buyer.`)) return
    if (supabase && session && selected.databaseId) {
      const { error } = await supabase.from('orders').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('id', selected.databaseId)
      if (error) return setNotice(error.message)
    }
    const cancelled = { ...selected, status: 'Cancelled' }
    setSelected(cancelled)
    setOrders(current => current.map(order => order.id === cancelled.id ? cancelled : order))
    setNotice('Order cancelled')
  }

  const saveProfile = async () => {
    if (supabase && session) {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: merchant.name, business_name: merchant.business, phone: merchant.phone || '' })
      if (error) return setNotice(error.message)
    }
    setNotice('Profile saved')
  }

  const saveProduct = async () => {
    if (!productDraft.name.trim() || Number(productDraft.price) <= 0) return setNotice('Add a product name and valid price.')
    setProductBusy(true)
    setNotice('')
    try {
      let imageUrl = ''
      if (supabase && session && productDraft.image) {
        const extension = productDraft.image.name.split('.').pop() || 'jpg'
        const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, productDraft.image, { upsert: false })
        if (uploadError) throw uploadError
        imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      }
      const product = { merchant_id: session?.user?.id, name: productDraft.name.trim(), description: productDraft.description.trim(), price: Number(productDraft.price), category: productDraft.category, image_url: imageUrl, active: true }
      if (supabase && session) {
        const { data, error } = await supabase.from('products').insert(product).select().single()
        if (error) throw error
        setProducts(current => [data, ...current])
      } else setProducts(current => [{ ...product, id: crypto.randomUUID(), image_url: imageUrl || seedProducts[0].image_url }, ...current])
      setProductDraft({ name: '', description: '', price: '', category: 'Fashion', image: null })
      go('products')
    } catch (error) { setNotice(error.message) } finally { setProductBusy(false) }
  }

  const toggleProduct = async (product) => {
    const next = !product.active
    if (supabase && session && !String(product.id).startsWith('sample-')) {
      const { error } = await supabase.from('products').update({ active: next, updated_at: new Date().toISOString() }).eq('id', product.id)
      if (error) return setNotice(error.message)
    }
    setProducts(current => current.map(item => item.id === product.id ? { ...item, active: next } : item))
  }

  const addToCart = (product) => {
    setCart(current => {
      const found = current.find(entry => entry.product.id === product.id)
      return found ? current.map(entry => entry.product.id === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { product, quantity: 1 }]
    })
  }

  const changeCartQuantity = (productId, change) => setCart(current => current.map(entry => entry.product.id === productId ? { ...entry, quantity: Math.max(0, entry.quantity + change) } : entry).filter(entry => entry.quantity > 0))

  const createCartOrder = async () => {
    if (!draft.name || !draft.email || !draft.address || cart.length === 0) return setNotice('Add your name, email and delivery address.')
    const itemName = cart.map(entry => `${entry.product.name} × ${entry.quantity}`).join(', ')
    const quantity = cart.reduce((sum, entry) => sum + entry.quantity, 0)
    if (!supabase || !storeMerchantId) return setNotice('This storefront checkout requires a connected store.')
    const orderNumber = `OF-${Date.now().toString().slice(-6)}`
    const cartPayload = cart.map(entry => ({ product_id: entry.product.id, quantity: entry.quantity }))
    const { data, error } = await supabase.rpc('create_store_order', { p_merchant: storeMerchantId, p_order_number: orderNumber, p_customer_name: draft.name, p_customer_phone: draft.phone || '', p_cart: cartPayload, p_delivery_address: draft.address }).maybeSingle()
    if (error || !data) return setNotice(error?.message || 'The order could not be created.')
    const secureTotal = Number(data.total)
    const order = { id: orderNumber, publicToken: data.public_token, name: draft.name, phone: draft.phone, item: itemName, qty: 1, unitPrice: secureTotal, deliveryFee: 0, amount: secureTotal, address: draft.address, status: 'Confirmed', createdAt: new Date().toISOString() }
    setSelected(order)
    setDraft(current => ({ ...current, item: itemName, qty: 1, price: String(secureTotal), delivery: '0' }))
    go('payment')
  }

  const shareStore = async () => {
    const url = `${window.location.origin}/?store=${encodeURIComponent(session?.user?.id || '')}`
    if (navigator.share) return navigator.share({ title: `${merchant.business} catalogue`, text: `Shop from ${merchant.business} on OrderFlow`, url })
    await navigator.clipboard.writeText(url)
    setNotice('Store link copied')
  }

  const openStorefront = async () => {
    if (!supabase || !storeMerchantId) return go('welcome')
    setScreen('public-loading')
    const { data, error } = await supabase.rpc('get_public_store', { p_merchant: storeMerchantId }).maybeSingle()
    if (error || !data) {
      setNotice('The seller storefront could not be opened.')
      return setScreen('public-error')
    }
    setMerchant(current => ({ ...current, business: data.business_name || current.business, phone: data.phone || current.phone }))
    setProducts(Array.isArray(data.products) ? data.products : [])
    setCart([])
    go('store')
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    go('welcome')
  }

  const startPayment = async () => {
    if (paymentMethod === 'opay') return setNotice('OPay setup requires approved merchant API credentials. Choose Paystack or Bank transfer for this test payment.')
    if (paymentMethod === 'escrow') return setNotice('Escrow is shown as a planned protected-payment option. It will be activated after the holding and release process is completed.')
    setPaymentBusy(true)
    setNotice('')
    try {
      sessionStorage.setItem('orderflow-buyer-order', JSON.stringify({ selected, draft, merchant: { business: merchant.business, phone: merchant.phone }, storeMerchantId, cart }))
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: draft.email || auth.email || session?.user?.email || merchant.email,
          orderId: selected?.id || 'OF-1025',
          orderToken: selected?.publicToken,
          paymentMethod,
        }),
      })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(response.status === 404 ? 'Payment service is not available in this deployment. Redeploy the API route and try again.' : 'The payment service returned an invalid response. Please try again.')
      }
      const result = await response.json()
      if (!response.ok || !result.authorizationUrl) throw new Error(result.message || 'Unable to start payment')
      window.location.assign(result.authorizationUrl)
    } catch (error) {
      setNotice(error.message)
      setPaymentBusy(false)
    }
  }

  if (screen === 'splash') return <main className="splash"><OrderFlowLogo /><p>Orders made simple.</p><div className="splash-pulse" /></main>

  if (screen === 'public-loading') return <main className="splash"><OrderFlowLogo /><p>{publicOrderLoading ? 'Opening your secure order…' : 'Loading order…'}</p><div className="splash-pulse" /></main>

  if (screen === 'public-error') return <AppShell onBack={go}><section className="success"><div className="order-link-error">!</div><h1>Order unavailable</h1><p>{notice || 'This order link is invalid or has expired.'}</p><button onClick={() => { window.history.replaceState({}, '', window.location.pathname); go('welcome') }}>Go to OrderFlow</button></section></AppShell>


  if (screen === 'welcome') return <AppShell onBack={go}><section className="welcome"><div className="welcome-brand"><OrderFlowLogo compact /></div><div className="welcome-art" aria-hidden="true"><span className="flow-card flow-card-one">New order</span><span className="flow-card flow-card-two">Payment secured</span><span className="flow-card flow-card-three">Ready to deliver</span><div className="flow-mark"><i /><i /><i /></div></div><h1>Turn every DM into a confirmed order.</h1><p>Create orders, receive secure payments and keep every customer updated in one place.</p><div className="channels"><span>● WhatsApp</span><span>● Instagram</span></div><button onClick={() => go('signup')}>Create a free account</button><button className="secondary" onClick={() => go('signin')}>Sign in</button><small className="welcome-trust">Built for independent sellers and growing businesses.</small></section></AppShell>

  if (screen === 'signup') return <AppShell onBack={go} back="welcome" title="Create your account"><section className="form auth-form"><div className="auth-intro"><h1>Let’s get you started</h1><p>Set up your store and start turning conversations into paid orders.</p></div><button className="social google-button" onClick={signInWithGoogle}><GoogleIcon /><span>Continue with Google</span></button><div className="or"><span>or create an account with email</span></div>{authField('name','Full name','text','Your full name')}{authField('email','Email address','email','you@business.com')}{authField('password','Password','password','At least 8 characters')}{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.name || !auth.email || auth.password.length < 8} onClick={signUp}>{authBusy ? 'Creating account…' : 'Continue'}</button><div className="auth-soft-design"><span>Simple setup</span><span>Secure payments</span><span>Live tracking</span></div><p className="center auth-switch">Already have an account? <a onClick={() => go('signin')}>Sign in</a></p></section></AppShell>

  if (screen === 'signin') return <AppShell onBack={go} back="welcome"><section className="form auth-form"><div className="auth-logo"><OrderFlowLogo compact /></div><div className="auth-intro"><h1>Welcome back</h1><p>Sign in to manage orders, buyers and payments.</p></div><button className="social google-button" onClick={signInWithGoogle}><GoogleIcon /><span>Continue with Google</span></button><div className="or"><span>or continue with email</span></div>{authField('email','Email address','email','you@business.com')}<label><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} value={auth.password} placeholder="Your password" onChange={event => setAuth({ ...auth, password: event.target.value })}/><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label><div className="signin-options"><label className="remember"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)}/><span>Remember me</span></label><button type="button" className="text-button" onClick={resetPassword}>Forgot password?</button></div>{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.email || !auth.password} onClick={signIn}>{authBusy ? 'Signing in…' : 'Sign in'}</button><div className="auth-soft-design"><span>Your orders</span><span>Your buyers</span><span>One clear view</span></div><p className="center auth-switch">New to OrderFlow? <a onClick={() => go('signup')}>Create an account</a></p>{!isSupabaseConfigured && <small className="center">Demo mode is active until Supabase is connected.</small>}</section></AppShell>

  if (screen === 'setup') return <AppShell onBack={go} back="signup" title="Set up your business"><section className="form"><h1>Make OrderFlow yours</h1><label><span>Business name</span><input value={merchant.business} onChange={e => setMerchant({ ...merchant, business: e.target.value })} /></label><label><span>What do you sell?</span><select><option>Fashion and accessories</option><option>Beauty and personal care</option><option>Food and drinks</option><option>Services</option></select></label><label><span>WhatsApp business number</span><input placeholder="0801 234 5678" /></label>{notice && <div className="notice">{notice}</div>}<button onClick={completeSetup}>Complete setup</button></section></AppShell>

  if (screen === 'dashboard') return <AppShell onBack={go} merchantHeader merchantName={merchant.name} onNotifications={() => setNotificationsOpen(value => !value)} onProfile={() => go('profile')}><section className="dashboard"><div className="dash-head"><div><p>Good afternoon, {merchant.name}</p><h1>Orders</h1></div></div>{notificationsOpen && <aside className="notification-panel"><div><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></div><p><b>Payment received</b><span>An order payment has been confirmed.</span></p><p><b>Order update</b><span>Review your awaiting orders.</span></p></aside>}<CommerceBanner /><button className="create-order-button" onClick={() => go('create')}>+ Create new order</button><div className="stats"><div><span>Awaiting</span><b>{orderStats.awaiting}</b></div><div><span>Active</span><b>{orderStats.active}</b></div><div><span>Issues</span><b>{orderStats.issues}</b></div></div><div className="dashboard-workspace"><div className="recent-orders-panel"><div className="section-title"><h2>Recent orders</h2><button className="section-link" onClick={() => go('orders')}>View all</button></div><div className="orders">{orders.slice(0,5).map(order => <button className="order" key={order.id} onClick={() => { setSelected(order); go('merchant-order') }}><div><b>{order.id} · {order.name}</b><span>{order.qty} item{order.qty > 1 ? 's' : ''} · {naira.format(order.amount)}</span><small>{order.channel} · {orderDate.format(new Date(order.createdAt || Date.now()))}</small></div><em className={order.status.toLowerCase().replaceAll(' ','-')}>{order.status}</em></button>)}{orders.length === 0 && <div className="empty-state"><strong>No orders yet</strong><span>Create your first order to see it here.</span></div>}</div></div><aside className="dashboard-support"><div className="section-title"><h2>Quick actions</h2></div><button className="quick-action" onClick={() => go('create')}><NavIcon type="orders"/><span><b>Create new order</b><small>Prepare a secure buyer link</small></span></button><button className="quick-action" onClick={() => go('buyers')}><NavIcon type="buyers"/><span><b>View buyers</b><small>Open your customer directory</small></span></button><button className="quick-action" onClick={() => go('profile')}><NavIcon type="profile"/><span><b>Business profile</b><small>Review your store details</small></span></button><div className="activity-note"><span>Today</span><strong>{orderStats.active} active order{orderStats.active === 1 ? '' : 's'}</strong><small>Keep buyers informed as orders progress.</small></div></aside></div></section><MerchantNav active="dashboard" onNavigate={go}/></AppShell>

  if (screen === 'products') return <AppShell onBack={go} back="dashboard" title="Products"><section className="dashboard products-screen"><div className="catalogue-head"><div><h1>Your catalogue</h1><p>Products buyers can browse and add to their cart.</p></div><button onClick={() => go('add-product')}>+ Add product</button></div><div className="store-share-card"><span><b>Your public store</b><small>Share one link for buyers to browse and checkout.</small></span><button className="secondary" onClick={shareStore}>Copy or share link</button></div>{notice && <div className="notice">{notice}</div>}<div className="merchant-product-grid">{products.map(product => <article className={`merchant-product-card${product.active === false ? ' unavailable' : ''}`} key={product.id}><div className="product-image" style={{ backgroundImage: `url(${product.image_url || seedProducts[0].image_url})` }}/><div><small>{product.category}</small><h3>{product.name}</h3><strong>{naira.format(product.price)}</strong><button className="secondary" onClick={() => toggleProduct(product)}>{product.active === false ? 'Make available' : 'Mark unavailable'}</button></div></article>)}</div></section><MerchantNav active="products" onNavigate={go}/></AppShell>

  if (screen === 'add-product') return <AppShell onBack={go} back="products" title="Add product"><section className="form product-form"><h1>Add to your catalogue</h1><p>Use a clear photo and a simple description buyers can understand quickly.</p><label><span>Product image</span><input type="file" accept="image/*" onChange={event => setProductDraft({ ...productDraft, image: event.target.files?.[0] || null })}/></label><label><span>Product name</span><input value={productDraft.name} placeholder="e.g. Classic handbag" onChange={event => setProductDraft({ ...productDraft, name: event.target.value })}/></label><label><span>Short description</span><input value={productDraft.description} placeholder="What should the buyer know?" onChange={event => setProductDraft({ ...productDraft, description: event.target.value })}/></label><div className="two"><label><span>Price</span><input type="number" min="0" value={productDraft.price} placeholder="₦ 0" onChange={event => setProductDraft({ ...productDraft, price: event.target.value })}/></label><label><span>Category</span><select value={productDraft.category} onChange={event => setProductDraft({ ...productDraft, category: event.target.value })}><option>Fashion</option><option>Beauty</option><option>Food</option><option>Electronics</option><option>Home</option><option>Other</option></select></label></div>{notice && <div className="notice">{notice}</div>}<button disabled={productBusy} onClick={saveProduct}>{productBusy ? 'Saving product…' : 'Add product'}</button></section><MerchantNav active="products" onNavigate={go}/></AppShell>

  if (screen === 'store') return <AppShell onBack={go}><section className="storefront"><div className="store-identity"><div className="avatar">{merchant.business.slice(0,2).toUpperCase()}</div><div><h1>{merchant.business}</h1><p>Shop securely and track every order.</p></div><button className="cart-button" onClick={() => go('cart')} aria-label="Open cart"><NavIcon type="products"/><span>{cart.reduce((sum, entry) => sum + entry.quantity, 0)}</span></button></div><input className="search" type="search" value={storeSearch} onChange={event => setStoreSearch(event.target.value)} placeholder="Search products"/><div className="store-trust"><span>✓ Secure payments</span><span>✓ Order tracking</span></div><div className="store-product-grid">{visibleProducts.map(product => <article className="store-product-card" key={product.id}><div className="product-image" style={{ backgroundImage: `url(${product.image_url || seedProducts[0].image_url})` }}/><small>{product.category}</small><h3>{product.name}</h3><p>{product.description}</p><div><strong>{naira.format(product.price)}</strong><button onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>+</button></div></article>)}{visibleProducts.length === 0 && <div className="empty-state"><strong>No products found</strong><span>Try another search.</span></div>}</div>{cart.length > 0 && <button className="floating-cart" onClick={() => go('cart')}>View cart · {naira.format(cartTotal)}</button>}</section></AppShell>

  if (screen === 'cart') return <AppShell onBack={go} back="store" title="Your cart"><section className="form cart-screen"><div className="section-title"><h1>Your cart</h1><span>{cart.reduce((sum, entry) => sum + entry.quantity, 0)} items</span></div>{cart.map(entry => <article className="cart-item" key={entry.product.id}><div className="product-image" style={{ backgroundImage: `url(${entry.product.image_url || seedProducts[0].image_url})` }}/><div><h3>{entry.product.name}</h3><strong>{naira.format(entry.product.price)}</strong><div className="quantity-control"><button onClick={() => changeCartQuantity(entry.product.id, -1)}>−</button><span>{entry.quantity}</span><button onClick={() => changeCartQuantity(entry.product.id, 1)}>+</button></div></div></article>)}<div className="card rows"><p><span>Subtotal</span><b>{naira.format(cartTotal)}</b></p><p className="strong"><span>Total before delivery</span><b>{naira.format(cartTotal)}</b></p></div><button disabled={cart.length === 0} onClick={() => go('store-delivery')}>Continue to checkout</button><button className="link" onClick={() => go('store')}>Keep shopping</button></section></AppShell>

  if (screen === 'store-delivery') return <AppShell onBack={go} back="cart" title="Delivery details"><section className="form"><p>Where should {merchant.business} deliver your order?</p>{field('name','Full name')}{field('phone','Phone number','tel')}{field('email','Email address','email','you@example.com')}{field('address','Delivery address','text','Street, area and city')}<div className="total"><span>Cart total</span><b>{naira.format(cartTotal)}</b></div>{notice && <div className="notice">{notice}</div>}<button onClick={createCartOrder}>Continue to payment</button></section></AppShell>

  if (screen === 'orders') return <AppShell onBack={go} back="dashboard" title="All orders"><section className="dashboard orders-screen"><div className="orders-summary"><span><b>{orders.length}</b> total</span><span><b>{orderStats.awaiting}</b> awaiting</span><span><b>{orderStats.active}</b> active</span></div><input className="search" type="search" value={orderSearch} onChange={event => setOrderSearch(event.target.value)} placeholder="Search order, buyer, phone or item"/><div className="filter-row" aria-label="Filter orders">{['All','Pending','Confirmed','Paid','Out for delivery','Delivered','Cancelled'].map(filter => <button key={filter} className={orderFilter === filter ? 'active' : ''} onClick={() => setOrderFilter(filter)}>{filter}</button>)}</div><div className="orders order-list">{filteredOrders.map(order => <button className="order" key={order.id} onClick={() => { setSelected(order); go('merchant-order') }}><div><b>{order.id} · {order.name}</b><span>{order.item} × {order.qty} · {naira.format(order.amount)}</span><small>{orderDate.format(new Date(order.createdAt || Date.now()))}</small></div><em className={order.status.toLowerCase().replaceAll(' ','-')}>{order.status}</em></button>)}{filteredOrders.length === 0 && <div className="empty-state"><strong>No matching orders</strong><span>Try another search or status filter.</span></div>}</div><button className="orders-create" onClick={() => go('create')}>+ Create new order</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'create') return <AppShell onBack={go} back="dashboard" title="Create order"><section className="form"><p className="step">Step 1 of 2 · Order details</p>{field('name','Customer name','text','Enter customer’s name')}{field('phone','Phone number','tel','0801 234 5678')}{field('item','Item or service','text','e.g. Leather handbag')}<div className="two">{field('qty','Quantity','number')}{field('price','Unit price','number','₦ 0.00')}</div>{field('delivery','Delivery fee','number','₦ 0.00')}<div className="total"><span>Order total</span><b>{naira.format(total)}</b></div><button disabled={!draft.name || !draft.item || !draft.price} onClick={() => go('review')}>Continue</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'review') return <AppShell onBack={go} back="create" title="Review order"><section className="form"><p className="step">Step 2 of 2 · Check before sharing</p><article className="card"><small>CUSTOMER</small><h3>{draft.name}</h3><p>{draft.phone}</p></article><h2>Order summary</h2><article className="card rows"><p><span>{draft.item} × {draft.qty}</span><b>{naira.format(Number(draft.price) * Number(draft.qty))}</b></p><p><span>Delivery fee</span><b>{naira.format(Number(draft.delivery || 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total)}</b></p></article>{notice && <div className="notice">{notice}</div>}<button onClick={saveOrder}>Create secure order link</button><button className="secondary" onClick={() => { setNotice('Draft saved'); go('dashboard') }}>Save as draft</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'link') {
    const orderId = selected?.id || 'OF-1025'
    const publicToken = selected?.publicToken || orderId
    const orderLink = typeof window === 'undefined' ? '' : `${window.location.origin}/?order=${encodeURIComponent(publicToken)}`
    const shareOnWhatsApp = () => {
      const message = `Hi ${draft.name || 'there'}, ${merchant.business} has created order ${orderId} for ${draft.item || 'your item'}. Total: ${naira.format(total || selected?.amount || 18500)}. Review your order here: ${orderLink}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    }
    return <AppShell onBack={go}><section className="success"><div className="check">✓</div><h1>Order link is ready!</h1><p>Send this secure link to {draft.name || 'your customer'} so they can review and confirm the order.</p><div className="copy"><span>{orderLink}</span><button onClick={async () => { try { await navigator.clipboard.writeText(orderLink); setNotice('Link copied') } catch { setNotice('Copy the link above') } }}>Copy</button></div>{notice && <div className="notice">{notice}</div>}<button className="whatsapp" onClick={shareOnWhatsApp}>Share on WhatsApp</button><button className="secondary" onClick={async () => { if (navigator.share) await navigator.share({ title: `Order ${orderId}`, text: `Review your order from ${merchant.business}`, url: orderLink }); else { await navigator.clipboard.writeText(orderLink); setNotice('Link copied—share it with your buyer.') } }}>Share another way</button><button className="link" onClick={() => go('dashboard')}>Back to dashboard</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>
  }

  if (screen === 'confirm') return <AppShell onBack={go}><section className="form buyer-checkout"><div className="brand center">OrderFlow</div><div className="buyer-welcome"><small>Secure order from {merchant.business}</small><h1>Hi {draft.name || 'there'}, your order is ready to review.</h1><p>Everything is clearly listed below. Confirm when you are happy to continue.</p></div><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>Order number</span><b>{selected?.id || 'OF-1025'}</b></p><p><span>{draft.item || 'Your item'} × {draft.qty}</span><b>{naira.format(Number(draft.price || 15000) * Number(draft.qty || 1))}</b></p><p><span>Delivery</span><b>{naira.format(Number(draft.delivery || 3500))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total || selected?.amount || 18500)}</b></p></article><div className="buyer-trust"><span>✓ Secure checkout</span><span>✓ Live delivery updates</span></div>{notice && <div className="notice">{notice}</div>}<button onClick={confirmBuyerOrder}>{selected?.status === 'Confirmed' ? 'Continue to delivery' : 'Confirm order details'}</button><button className="secondary" onClick={() => setNotice('Please contact the seller using the WhatsApp message you received and describe the correction needed.')}>Request a correction</button></section></AppShell>

  if (screen === 'delivery') return <AppShell onBack={go} back="confirm" title="Delivery details"><section className="form"><p>Where should the seller deliver your order?</p>{field('name','Full name')}{field('phone','Phone number','tel')}{field('email','Email address','email','you@example.com')}{field('address','Delivery address','text','Street, area and city')}<div className="total"><span>Order total</span><b>{naira.format(total || 18500)}</b></div><button disabled={!draft.name || !draft.email || !draft.address} onClick={() => go('payment')}>Continue to payment</button></section></AppShell>

  if (screen === 'payment') return <AppShell onBack={go} back="delivery" title="Choose payment method"><section className="form payment-form"><div className="payment-summary"><span>Amount to pay</span><strong>{naira.format(total || 18500)}</strong><small>Protected checkout · Test mode</small></div><label className={`choice ${paymentMethod === 'paystack' ? 'selected' : ''}`}><input type="radio" name="payment" checked={paymentMethod === 'paystack'} onChange={() => { setPaymentMethod('paystack'); setNotice('') }}/><span><b>Paystack checkout</b><small>Card, USSD and mobile money</small></span><em>Recommended</em></label><label className={`choice ${paymentMethod === 'bank-transfer' ? 'selected' : ''}`}><input type="radio" name="payment" checked={paymentMethod === 'bank-transfer'} onChange={() => { setPaymentMethod('bank-transfer'); setNotice('') }}/><span><b>Bank transfer</b><small>Pay securely by transfer through Paystack</small></span></label><label className={`choice ${paymentMethod === 'escrow' ? 'selected' : ''}`}><input type="radio" name="payment" checked={paymentMethod === 'escrow'} onChange={() => setPaymentMethod('escrow')}/><span><b>Protected payment (Escrow)</b><small>Funds released after delivery · Coming soon</small></span></label><label className={`choice ${paymentMethod === 'opay' ? 'selected' : ''}`}><input type="radio" name="payment" checked={paymentMethod === 'opay'} onChange={() => setPaymentMethod('opay')}/><span><b>OPay</b><small>Merchant connection required · Coming soon</small></span></label>{notice && <div className="notice">{notice}</div>}<button disabled={paymentBusy} onClick={startPayment}>{paymentBusy ? 'Opening secure payment…' : paymentMethod === 'escrow' || paymentMethod === 'opay' ? 'Check availability' : `Pay ${naira.format(total || 18500)}`}</button><small className="center payment-note">Paystack is currently in test mode. No real money will be charged.</small></section></AppShell>

  if (screen === 'paid') return <AppShell onBack={go} back="dashboard"><section className="success"><div className="check">✓</div><h1>Payment successful</h1><p>Your seller has been notified.</p><article className="card rows"><p><span>Amount paid</span><b>{naira.format(total || selected?.amount || 18500)}</b></p><p><span>Order ID</span><b>{selected?.id || 'Order'}</b></p><p><span>Method</span><b>Paystack</b></p></article><button onClick={openTracking}>Track my order</button>{storeMerchantId && <button className="secondary" onClick={openStorefront}>Continue shopping</button>}<button className="link" onClick={() => go('welcome')}>Back to OrderFlow</button></section></AppShell>

  if (screen === 'tracking') {
    const status = selected?.status || 'Pending'
    const activeIndex = trackingSteps.indexOf(status)
    const [heading, description] = trackingCopy[status] || trackingCopy.Pending
    return <AppShell onBack={go} back="paid" title="Track your order"><section className="form tracking-screen"><div className={`tracking-status ${status.toLowerCase().replaceAll(' ', '-')}`}><small>LIVE ORDER STATUS</small><h1>{heading}</h1><p>{description}</p></div><p className="tracking-updated">Last updated {orderDate.format(new Date(selected?.updatedAt || selected?.createdAt || Date.now()))}</p><article className="card rows"><p><span>Order</span><b>{selected?.id || 'Order'}</b></p><p><span>Order from</span><b>{merchant.business}</b></p><p><span>Total</span><b>{naira.format(selected?.amount || total || 18500)}</b></p></article><div className="tracking-heading"><h2>Order progress</h2><button onClick={refreshTracking} disabled={publicOrderLoading}>{publicOrderLoading ? 'Refreshing…' : 'Refresh status'}</button></div><div className="timeline">{trackingSteps.map((step, index) => <p key={step} className={status === 'Cancelled' ? '' : index < activeIndex ? 'done' : index === activeIndex ? 'current' : ''}><b>{step === 'Confirmed' ? 'Order confirmed' : step}</b><span>{step === 'Confirmed' ? 'Seller confirmed the order details' : step === 'Payment received' ? 'Payment has been securely confirmed' : step === 'Out for delivery' ? 'Your package is on the way' : 'Order received by the buyer'}</span></p>)}</div>{status === 'Cancelled' && <div className="notice tracking-cancelled">This order has been cancelled.</div>}{notice && <div className="notice">{notice}</div>}<button className="secondary" onClick={contactSeller}>Contact seller on WhatsApp</button></section></AppShell>
  }

  if (screen === 'buyers') return <AppShell onBack={go} back="dashboard"><section className="dashboard"><OrderFlowLogo compact /><FeatureBanner type="buyers" /><h1>Buyers</h1><p>People who have ordered from your store.</p><input className="search" placeholder="Search name, phone or order ID" />{orders.map(order=><button className="buyer" key={order.id} onClick={()=>{setSelected(order);go('merchant-order')}}><span className="avatar">{order.name.split(' ').map(n=>n[0]).join('')}</span><span><b>{order.name}</b><small>{order.phone || '0801 234 5678'} · {orderDate.format(new Date(order.createdAt || Date.now()))}</small></span><em>View details</em></button>)}<button onClick={() => go('create')}>Create order for this buyer</button></section><MerchantNav active="buyers" onNavigate={go}/></AppShell>

  if (screen === 'profile') return <AppShell onBack={go} back="dashboard" title="Profile"><section className="form profile-form"><FeatureBanner type="profile" /><div className="profile-head"><span className="avatar profile-avatar">{merchant.name.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase()}</span><div><h1>{merchant.name}</h1><p>{merchant.business}</p></div></div><label><span>Full name</span><input value={merchant.name} onChange={event => setMerchant({ ...merchant, name: event.target.value })}/></label><label><span>Business name</span><input value={merchant.business} onChange={event => setMerchant({ ...merchant, business: event.target.value })}/></label><label><span>Email address</span><input type="email" value={merchant.email || session?.user?.email || ''} onChange={event => setMerchant({ ...merchant, email: event.target.value })}/></label><label><span>Phone number</span><input type="tel" value={merchant.phone || ''} placeholder="0801 234 5678" onChange={event => setMerchant({ ...merchant, phone: event.target.value })}/></label>{notice && <div className="notice">{notice}</div>}<div className="profile-actions"><button onClick={saveProfile}>Save profile</button><button className="secondary" onClick={signOut}>Sign out</button></div></section><MerchantNav active="profile" onNavigate={go}/></AppShell>

  if (screen === 'edit-order' && editingOrder) return <AppShell onBack={go} back="merchant-order" title="Edit order"><section className="form"><label><span>Customer name</span><input value={editingOrder.name} onChange={event => setEditingOrder({ ...editingOrder, name: event.target.value })}/></label><label><span>Phone number</span><input type="tel" value={editingOrder.phone || ''} onChange={event => setEditingOrder({ ...editingOrder, phone: event.target.value })}/></label><label><span>Item or service</span><input value={editingOrder.item} onChange={event => setEditingOrder({ ...editingOrder, item: event.target.value })}/></label><div className="two"><label><span>Quantity</span><input type="number" min="1" value={editingOrder.qty} onChange={event => setEditingOrder({ ...editingOrder, qty: event.target.value })}/></label><label><span>Unit price</span><input type="number" min="0" value={editingOrder.unitPrice} onChange={event => setEditingOrder({ ...editingOrder, unitPrice: event.target.value })}/></label></div><label><span>Delivery fee</span><input type="number" min="0" value={editingOrder.deliveryFee} onChange={event => setEditingOrder({ ...editingOrder, deliveryFee: event.target.value })}/></label><div className="total"><span>Updated total</span><b>{naira.format(Number(editingOrder.unitPrice || 0) * Number(editingOrder.qty || 1) + Number(editingOrder.deliveryFee || 0))}</b></div>{notice && <div className="notice">{notice}</div>}<button onClick={saveOrderEdits}>Save changes</button><button className="secondary" onClick={() => go('merchant-order')}>Cancel editing</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'merchant-order') return <AppShell onBack={go} back="orders" title={`Order ${selected.id}`}><section className="form"><p className="step">Created {orderDate.format(new Date(selected.createdAt || Date.now()))}</p><article className="card"><small>CUSTOMER</small><h3>{selected.name}</h3><p>{selected.phone || 'No phone number added'}</p></article><article className="card rows"><p><span>{selected.item} × {selected.qty}</span><b>{naira.format(Number(selected.unitPrice ?? ((selected.amount - Number(selected.deliveryFee || 3500)) / Number(selected.qty || 1))) * Number(selected.qty || 1))}</b></p><p><span>Delivery</span><b>{naira.format(Number(selected.deliveryFee ?? 3500))}</b></p><p className="strong"><span>Total</span><b>{naira.format(selected.amount)}</b></p></article><label><span>Update progress</span><select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}><option>Pending</option><option>Confirmed</option><option>Payment received</option><option>Out for delivery</option><option>Delivered</option><option>Cancelled</option></select></label><button onClick={updateOrderStatus}>Update order status</button><button className="secondary" onClick={openOrderEditor}>Edit order details</button>{selected.status !== 'Cancelled' && selected.status !== 'Delivered' && <button className="danger-button" onClick={cancelOrder}>Cancel order</button>}{notice&&<div className="notice">{notice}</div>}</section><MerchantNav active="merchant-order" onNavigate={go}/></AppShell>

  return null
}
