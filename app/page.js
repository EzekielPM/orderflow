'use client'

import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { ItemRows, validItems, itemTotal } from './order-items'
import StoreAccount from './store-account'
import {readCart,writeCart,buyerLink,rememberStore} from '../lib/buyer-context'
import {Icon, ThemeToggle, ProductPhoto, BuyerNav, CheckoutSummary, VendorOverview, TrackingView, StatusBadge} from './experience'

function AppShell({ children, back, title, onBack, merchantHeader = false, merchantName = '', onNotifications, onProfile }) {
  const isMerchant = merchantHeader || Children.toArray(children).some(child => child.type === MerchantNav)
  return <main className={`phone experience ${isMerchant ? 'ux-merchant-shell' : 'ux-public-shell'}`}>
    <header className={`topbar${merchantHeader ? ' merchant-topbar' : ''}`}>
      {merchantHeader ? <><OrderFlowLogo compact/><div className="topbar-actions">
        <button className="notification-button" onClick={onNotifications} aria-label="Open order activity"><BellIcon/></button>
        <button className="avatar avatar-button" onClick={onProfile} aria-label="Open business profile">{merchantName.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase() || 'OF'}</button><ThemeToggle/>
      </div></> : <>{back ? <button className="icon back-button" onClick={() => onBack(back)} aria-label="Go back"><Icon name="back"/></button> : <a href="/shop" className="ux-header-brand">Order<span>Flow</span></a>}<strong>{title || ''}</strong><ThemeToggle/></>}
    </header>{children}
  </main>
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
    ['dashboard', 'Overview'],
    ['orders', 'Orders'],
    ['products', 'Products'],
    ['profile', 'Business'],
  ]

  return (
    <nav aria-label="Merchant navigation">
      {items.map(([screen, label]) => (
        <button
          key={screen}
          aria-current={active === screen || (screen === 'orders' && active === 'merchant-order') ? 'page' : undefined}
          className={active === screen || (screen === 'orders' && active === 'merchant-order') ? 'active' : ''}
          onClick={() => onNavigate(screen)}
        >
          <NavIcon type={screen} /><span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
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
  const [merchant, setMerchant] = useState({ name: '', business: '', phone: '', email: '', deliveryFee: 0 })
  const [orders, setOrders] = useState([])
  const [draft, setDraft] = useState({ name: '', phone: '', email: '', item: '', qty: 1, price: '', delivery: '', address: '', note: '' })
  const [newItems, setNewItems] = useState([{name:'',quantity:1,unit_price:''}])
  const [statusDraft,setStatusDraft] = useState(null)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [session, setSession] = useState(null)
  const [auth, setAuth] = useState({ name: '', email: '', password: '' })
  const [authBusy, setAuthBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('paystack')
  const [paymentReference, setPaymentReference] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [publicOrderLoading, setPublicOrderLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('All')
  const [editingOrder, setEditingOrder] = useState(null)
  const [products, setProducts] = useState([])
  const emptyProductDraft = { name: '', description: '', price: '', category: 'Fashion', stock_quantity: '1', images: [], existingImages: [] }
  const [productDraft, setProductDraft] = useState(emptyProductDraft)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productBusy, setProductBusy] = useState(false)
  const [cart, setCart] = useState([])
  const [cartStoreReady,setCartStoreReady] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [storeCategory, setStoreCategory] = useState('All')
  const [storeMerchantId, setStoreMerchantId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productImageIndex, setProductImageIndex] = useState(0)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const checkoutLock = useRef(false)
  const verificationLock = useRef(false)
  const [trackingConnection, setTrackingConnection] = useState('online')
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const [accountError, setAccountError] = useState('')


  useEffect(()=>{
    if(storeMerchantId && cartStoreReady===storeMerchantId)writeCart(storeMerchantId,cart)
  },[cart,storeMerchantId,cartStoreReady])
  useEffect(()=>{
    if(!session?.user?.id || !selected?.publicToken || !['payment','paid','tracking'].includes(screen) || !supabase)return
    supabase.rpc('save_buyer_order',{p_token:selected.publicToken}).then(({error})=>{if(error)setNotice('Your order is available through its tracking link, but could not be saved to your account.')})
  },[session?.user?.id,selected?.publicToken,screen])

  useEffect(() => {
    if (!supabase || !session || !['dashboard','orders','merchant-order'].includes(screen)) return
    let stopped=false, pending=false
    async function syncOrders(){
      if (pending || document.hidden) return
      pending=true
      try {
        const {data,error}=await supabase.from('orders').select('*').eq('merchant_id',session.user.id).order('created_at',{ascending:false})
        if(stopped)return
        if(error || !data){setAccountError('Order updates are paused. Check your connection.');return}
        setAccountError('')
        const latest=data.map(o=>({id:o.order_number,databaseId:o.id,publicToken:o.public_token,name:o.customer_name,phone:o.customer_phone,item:o.item_name,qty:o.quantity,unitPrice:Number(o.unit_price),deliveryFee:Number(o.delivery_fee),amount:Number(o.unit_price)*o.quantity+Number(o.delivery_fee),channel:o.channel,status:o.status,paymentStatus:o.payment_status,createdAt:o.created_at,updatedAt:o.updated_at,address:o.delivery_address,note:o.buyer_note,lineItems:o.line_items||[]}))
        setOrders(latest)
        setSelected(current=>latest.find(o=>o.databaseId===current?.databaseId)||current)
      } catch {if(!stopped)setAccountError('Order updates are paused. Check your connection.')} finally {pending=false}
    }
    syncOrders()
    const timer=setInterval(syncOrders,10000)
    document.addEventListener('visibilitychange',syncOrders)
    return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',syncOrders)}
  },[session?.user?.id,screen])

  useEffect(()=>{
    if(!supabase || !selected?.publicToken || !['tracking','confirm','paid'].includes(screen))return
    const token=selected.publicToken
    let stopped=false,pending=false
    async function syncTracking(){
      if(pending || document.hidden)return
      pending=true
      try{
        const [{data,error},{data:lines}]=await Promise.all([
          supabase.rpc('get_public_order_tracking',{p_token:token}).maybeSingle(),
          supabase.rpc('get_public_order_lines',{p_token:token}),
        ])
        if(!stopped){
          if(error || !data){setTrackingConnection('offline');return}
          setTrackingConnection('online')
          setSelected(current=>current?.publicToken===token?{...current,status:data.status,paymentStatus:data.payment_status,updatedAt:data.updated_at,lineItems:Array.isArray(lines)?lines:current.lineItems}:current)
          setMerchant(current=>({...current,phone:data.merchant_phone || current.phone}))
        }
      }catch{if(!stopped)setTrackingConnection('offline')}finally{pending=false}
    }
    syncTracking();const timer=setInterval(syncTracking,10000)
    document.addEventListener('visibilitychange',syncTracking)
    return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',syncTracking)}
  },[selected?.publicToken,screen])

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('orderflow-remembered-email')
    if (rememberedEmail) setAuth(current => ({ ...current, email: rememberedEmail }))
    const params = new URLSearchParams(window.location.search)
    const hasPaymentReturn = params.has('reference')
    const hasPublicOrder = params.has('order') || params.has('track') || params.has('store')
    const timer = hasPaymentReturn || hasPublicOrder
      ? null
      : setTimeout(() => setScreen(current => current === 'splash' ? 'welcome' : current), 250)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const merchantId = params.get('store')
    if(params.has('reference'))return
    if (!merchantId) return
    setStoreMerchantId(merchantId)
    setScreen('public-loading')
    if (!supabase) {
      setNotice('The store could not connect. Please try again shortly.')
      setScreen('public-error')
      return
    }
    supabase.rpc('get_public_store', { p_merchant: merchantId }).maybeSingle().then(({ data, error }) => {
      if (error || !data) {
        setNotice('This storefront is unavailable.')
        setScreen('public-error')
        return
      }
      setMerchant(current => ({ ...current, business: data.business_name || 'OrderFlow Store', phone: data.phone || '', deliveryFee: Number(data.delivery_fee || 0) }))
      const liveProducts=Array.isArray(data.products)?data.products:[]
      setProducts(liveProducts)
      rememberStore(merchantId,data.business_name)
      const savedCart = readCart(merchantId)
      let pending
      try{pending=JSON.parse(sessionStorage.getItem(`orderflow-checkout:${merchantId}`) || 'null')}catch{}
      const fingerprint=JSON.stringify(savedCart.map(entry=>({product_id:entry.product.id,quantity:entry.quantity})).sort((a,b)=>a.product_id.localeCompare(b.product_id)))
      // A retried checkout may already have reserved this stock. Keep its quantities
      // so the server can return the same order using the same request reference.
      const isRetry=pending?.fingerprint===fingerprint
      const cleanCart = savedCart.map(entry=>{const product=liveProducts.find(p=>p.id===entry.product.id);return isRetry?{...entry,product:product || entry.product}:product?{product,quantity:Math.min(entry.quantity,Number(product.stock_quantity??0))}:null}).filter(entry=>entry&&entry.quantity>0)
      setCart(cleanCart)
      if(JSON.stringify(savedCart)!==JSON.stringify(cleanCart))setNotice('Your cart has been updated with the latest prices and available quantities. Please review it before paying.')
      setCartStoreReady(merchantId)
      const product = liveProducts.find(p=>p.id===params.get('product'))
      if(product){setSelectedProduct(product);setScreen('product-details')}
      else setScreen(params.get('view')==='checkout' && cleanCart.length ? 'store-delivery' : params.get('view')==='cart' ? 'cart' : 'store')
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
      supabase.rpc('get_public_order_tracking', { p_token: token }).maybeSingle(),
      supabase.rpc('get_public_order_context', {p_token:token}).maybeSingle(),
      supabase.rpc('get_public_order_lines', {p_token:token}),
    ])
      .then(([orderResult, trackingResult, contextResult, linesResult]) => {
        const { data, error } = orderResult
        if (error || !data) {
          setNotice('This order link is invalid or no longer available.')
          setScreen('public-error')
          return
        }
        const liveStatus = trackingResult.data
        if(contextResult.data?.merchant_id)setStoreMerchantId(contextResult.data.merchant_id)
        setSelected({ lineItems:linesResult.data || [],note:contextResult.data?.buyer_note || '', id: data.order_number, publicToken: token, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, unitPrice: Number(data.unit_price), deliveryFee: Number(data.delivery_fee), amount: Number(data.unit_price) * Number(data.quantity) + Number(data.delivery_fee), address: data.delivery_address, status: liveStatus?.status || data.status, createdAt: data.created_at, updatedAt: liveStatus?.updated_at, paymentStatus: liveStatus?.payment_status })
        setDraft(current => ({ ...current, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, price: String(data.unit_price), delivery: String(data.delivery_fee), address: data.delivery_address || '', note:contextResult.data?.buyer_note || '' }))
        setMerchant(current => ({ ...current, business: data.merchant_business || 'OrderFlow merchant', phone: liveStatus?.merchant_phone || current.phone }))
        setScreen(trackingToken || liveStatus?.payment_status === 'paid' || ['Cancelled','Delivered','Out for delivery'].includes(data.status) ? 'tracking' : 'confirm')
      })
      .catch(()=>{setNotice('We could not load this order. Please check your connection and reload.');setScreen('public-error')})
      .finally(() => setPublicOrderLoading(false))
  }, [])

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference')
    if (!reference || verificationLock.current) return
    verificationLock.current = true
    setPaymentReference(reference); setScreen('payment-check'); setPaymentBusy(true); setNotice('')
    let saved
    try { saved = JSON.parse(sessionStorage.getItem('orderflow-buyer-order') || 'null') } catch {}
    async function verify() {
      try {
        const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`,{cache:'no-store'})
        const result = await response.json()
        if (!result.paid) {setNotice(result.message || 'Payment is still being checked. Please check again.');return}
        if (!supabase || !result.orderToken) throw Error('Your payment was verified, but the order details are still loading. Check again shortly.')
        const [{data:orderData,error}, {data:tracking}, {data:lines}] = await Promise.all([
          supabase.rpc('get_public_order',{p_token:result.orderToken}).maybeSingle(),
          supabase.rpc('get_public_order_tracking',{p_token:result.orderToken}).maybeSingle(),
          supabase.rpc('get_public_order_lines',{p_token:result.orderToken}),
        ])
        if(error || !orderData)throw Error('Your payment was verified. Check again to load your order and tracking link.')
        const order = {id:orderData.order_number, publicToken:result.orderToken, name:orderData.customer_name, phone:orderData.customer_phone, item:orderData.item_name, qty:orderData.quantity, unitPrice:Number(orderData.unit_price), deliveryFee:Number(orderData.delivery_fee), amount:Number(orderData.unit_price)*Number(orderData.quantity)+Number(orderData.delivery_fee), address:orderData.delivery_address, status:tracking?.status || 'Payment received', paymentStatus:'paid', createdAt:orderData.created_at,updatedAt:tracking?.updated_at,lineItems:lines || []}
        setSelected(order)
        setDraft(current=>({...current,name:order.name,phone:order.phone,item:order.item,qty:order.qty,price:String(order.unitPrice),delivery:String(order.deliveryFee),address:order.address}))
        setMerchant(current=>({...current,business:orderData.merchant_business,phone:tracking?.merchant_phone || ''}))
        if(result.merchantId){
          setStoreMerchantId(result.merchantId)
          // Clear only this purchase, once. A later visit to this receipt must not erase a new cart.
          try {
            const marker = `orderflow-cleared-payment:${reference}`
            if(!localStorage.getItem(marker) && saved?.selected?.publicToken === result.orderToken){
              const remaining = readCart(result.merchantId).map(row=>({...row,quantity:Math.max(0,row.quantity-(saved.cart?.find(item=>item.product.id===row.product.id)?.quantity || 0))})).filter(row=>row.quantity>0)
              writeCart(result.merchantId,remaining);localStorage.setItem(marker,'1')
              sessionStorage.removeItem(`orderflow-checkout:${result.merchantId}`)
            }
          }catch{}
          setCart(readCart(result.merchantId));setCartStoreReady(result.merchantId)
        }
        window.history.replaceState({},'',`/?track=${encodeURIComponent(result.orderToken)}`)
        setScreen('paid')
      }catch(error){setNotice(error.message || 'We could not check your payment. Please try again.')}finally{setPaymentBusy(false);verificationLock.current=false}
    }
    verify()
  }, [verificationAttempt])

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
      if (isPublicFlow) return
      if (session.user.user_metadata?.account_type === 'buyer') { window.location.assign('/shop'); return }
      const [{ data: profile, error:profileError }, { data: savedOrders, error:ordersError }, { data: savedProducts, error:productsError }] = await Promise.all([
        supabase.from('profiles').select('full_name,business_name,phone,delivery_fee').eq('id', session.user.id).maybeSingle(),
        supabase.from('orders').select('*').eq('merchant_id',session.user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('merchant_id',session.user.id).order('created_at', { ascending: false }),
      ])
      if(profileError){setNotice('We could not load your business. Reload to try again.');setScreen('account-error');return}
      if(ordersError || productsError)setAccountError('Some business details could not be loaded. Please reload before making changes.')
      const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      if (profile) {
        setMerchant(current => ({ ...current, name: profile.full_name || googleName || 'Merchant', business: profile.business_name || 'My Store', phone: profile.phone || '', email: session.user.email || '', deliveryFee: Number(profile.delivery_fee || 0) }))
      } else {
        setMerchant(current => ({ ...current, name: googleName || 'Merchant', email: session.user.email || '' }))
      }
      if (savedOrders) setOrders(savedOrders.map(order => ({
        lineItems: order.line_items || [], note:order.buyer_note || '',
        paymentStatus: order.payment_status,
        updatedAt: order.updated_at,
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
    loadAccount().catch(()=>{setNotice('We could not load your business. Please reload.');setScreen('account-error')})
  }, [session?.user?.id])

  useEffect(()=>{
    if(session?.user?.email)setDraft(current=>({...current,email:current.email || session.user.email}))
  },[session?.user?.email])

  const total = useMemo(() => (['create','review'].includes(screen) ? itemTotal(newItems) : Number(draft.price || 0) * Number(draft.qty || 1)) + Number(draft.delivery || 0), [draft,newItems,screen])
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
  const storeCategories = useMemo(() => ['All', ...new Set(products.filter(product => product.active !== false).map(product => product.category).filter(Boolean))], [products])
  const visibleProducts = useMemo(() => products.filter(product => product.active !== false && (storeCategory === 'All' || product.category === storeCategory) && (!storeSearch.trim() || [product.name, product.category, product.description].some(value => String(value || '').toLowerCase().includes(storeSearch.trim().toLowerCase())))), [products, storeSearch, storeCategory])
  const cartTotal = useMemo(() => cart.reduce((sum, entry) => sum + Number(entry.product.price) * entry.quantity, 0), [cart])
  const go = (next) => { setStatusDraft(null); setScreen(next); setNotice(''); window.scrollTo(0, 0); requestAnimationFrame(()=>document.querySelector('.phone>section')?.scrollTo(0,0)) }
  const field = (key, label, type = 'text', placeholder = '') => <label><span>{label}</span><input type={type} value={draft[key]} placeholder={placeholder} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>
  const authField = (key, label, type = 'text', placeholder = '') => <label><span>{label}</span><input type={type} value={auth[key]} placeholder={placeholder} onChange={e => setAuth({ ...auth, [key]: e.target.value })} /></label>

  const signUp = async () => {
    if (!supabase) return setNotice('Sign-up is temporarily unavailable. Please try again shortly.')
    setAuthBusy(true)
    const { data, error } = await supabase.auth.signUp({ email: auth.email, password: auth.password, options: { data: { full_name: auth.name } } })
    setAuthBusy(false)
    if (error) return setNotice(error.message)
    setMerchant({ ...merchant, name: auth.name || 'Merchant' })
    if (!data.session) return setNotice('Check your email to confirm your account, then sign in.')
    go('setup')
  }

  const signIn = async () => {
    if (!supabase) return setNotice('Sign-in is temporarily unavailable. Please try again shortly.')
    setAuthBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password })
    setAuthBusy(false)
    if (error) return setNotice(error.message)
    if (rememberMe) localStorage.setItem('orderflow-remembered-email', auth.email)
    else localStorage.removeItem('orderflow-remembered-email')
    setScreen('splash')
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
    if(!merchant.business.trim())return setNotice('Add your business name.')
    if(!supabase || !session)return setNotice('Please sign in to save your business.')
    if (supabase && session) {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: merchant.name, business_name: merchant.business.trim(),phone:merchant.phone || '' })
      if (error) return setNotice(error.message)
    }
    go('dashboard')
  }

  const saveOrder = async () => {
    if(!supabase || !session)return setNotice('Please sign in again to create your order.')
    if(checkoutLock.current)return
    checkoutLock.current=true;setCheckoutBusy(true)
    try{
    if (supabase && session) {
      if (!validItems(newItems) || total <= 0) return setNotice('Check each item name, quantity and price.')
      const orderNumber = `OF-${crypto.randomUUID().slice(0,8).toUpperCase()}`
      const { data, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        merchant_id: session.user.id,
        customer_name: draft.name,
        customer_phone: draft.phone,
        line_items: newItems.map(i=>({name:i.name.trim(),quantity:Number(i.quantity),unit_price:Number(i.unit_price),note:(i.note||'').trim()})),
        item_name: newItems.map(i=>i.name).join(', '),
        quantity: 1,
        unit_price: itemTotal(newItems),
        delivery_fee: Number(draft.delivery || 0),
      }).select().single()
      if (error) return setNotice(error.message)
      const savedOrder = { lineItems:data.line_items || [], id: data.order_number, databaseId: data.id, publicToken: data.public_token, name: data.customer_name, phone: data.customer_phone, item: data.item_name, qty: data.quantity, unitPrice: Number(data.unit_price), deliveryFee: Number(data.delivery_fee), amount: total, channel: data.channel, status: data.status, createdAt: data.created_at || new Date().toISOString() }
      setDraft(current=>({...current,item:data.item_name,qty:1,price:String(data.unit_price)}))
      setSelected(savedOrder)
      setOrders(current => [savedOrder, ...current.filter(order => order.id !== savedOrder.id)])
    }
    go('link')
    }catch(error){setNotice(error.message || 'Could not create the order. Please retry.')}finally{checkoutLock.current=false;setCheckoutBusy(false)}
  }

  const confirmBuyerOrder = async () => {
    if(selected?.paymentStatus==='paid')return openTracking()
    if (supabase && selected?.publicToken) {
      const { data, error } = await supabase.rpc('confirm_public_order', { p_token: selected.publicToken })
      if (error) return setNotice('We could not confirm this order. Please try again.')
      if (!data && selected.status !== 'Confirmed') return setNotice('This order can no longer be confirmed.')
      setSelected(current => ({ ...current, status: 'Confirmed' }))
    }
    go('delivery')
  }

  const updateOrderStatus = async () => {
    const nextStatus=statusDraft || selected.status
    if(nextStatus==='Payment received' && selected.paymentStatus!=='paid')return setNotice('Payment received is updated automatically after Paystack verification.')
    const updatedAt = new Date().toISOString()
    if (supabase && session && selected.databaseId) {
      const { error } = await supabase.from('orders').update({ status: nextStatus, updated_at: updatedAt }).eq('id', selected.databaseId)
      if (error) return setNotice(error.message)
    }
    const updated = { ...selected, status:nextStatus, updatedAt }
    setStatusDraft(null)
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
    setTrackingConnection('online')
  }

  const openTracking = () => {
    if (selected?.publicToken) {
      window.history.replaceState({}, '', `/?track=${encodeURIComponent(selected.publicToken)}`)
    }
    go('tracking')
  }

  const contactSeller = () => {
    const phone = String(merchant.phone || '').replace(/\D/g, '').replace(/^0/, '234')
    if (!phone) return setNotice('The seller has not added a WhatsApp number yet.')
    const message = encodeURIComponent(`Hello, I am contacting you about OrderFlow order ${selected?.id || ''}.`)
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const shareTrackingLink = async () => {
    if (!selected?.publicToken) return setNotice('A secure tracking link is not available for this order.')
    const url = `${window.location.origin}/?track=${encodeURIComponent(selected.publicToken)}`
    const shareData = { title: `Track order ${selected.id}`, text: `Track order ${selected.id} from ${merchant.business}`, url }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(url); setNotice('Tracking link copied') }
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice('The tracking link could not be shared. Please try again.')
    }
  }

  const openOrderEditor = () => {
    setEditingOrder({
      ...selected,
      unitPrice: Number(selected.unitPrice ?? Math.max(Number(selected.amount || 0) - Number(selected.deliveryFee || 0), 0) / Number(selected.qty || 1)),
      deliveryFee: Number(selected.deliveryFee ?? 0),
    })
    go('edit-order')
  }

  const saveOrderEdits = async () => {
    if (editingOrder.lineItems?.length && !validItems(editingOrder.lineItems)) return setNotice('Check all item details.')
    const quantity = editingOrder.lineItems?.length ? 1 : Math.max(1, Number(editingOrder.qty || 1))
    const unitPrice = editingOrder.lineItems?.length ? itemTotal(editingOrder.lineItems) : Math.max(0, Number(editingOrder.unitPrice || 0))
    const deliveryFee = Math.max(0, Number(editingOrder.deliveryFee || 0))
    if (!editingOrder.name?.trim() || !editingOrder.item?.trim()) return setNotice('Customer name and item are required.')
    if (supabase && session && editingOrder.databaseId) {
      const { error } = await supabase.from('orders').update({ ...(editingOrder.lineItems?.length ? {line_items:editingOrder.lineItems.map(i=>({...i,quantity:Number(i.quantity),unit_price:Number(i.unit_price)}))} : {}), customer_name: editingOrder.name.trim(), customer_phone: editingOrder.phone || '', item_name: editingOrder.item.trim(), quantity, unit_price: unitPrice, delivery_fee: deliveryFee, updated_at: new Date().toISOString() }).eq('id', editingOrder.databaseId)
      if (error) return setNotice(error.message)
    }
    const updated = { ...editingOrder, item:editingOrder.lineItems?.length ? editingOrder.lineItems.map(i=>`${i.name} × ${i.quantity}`).join(', ') : editingOrder.item, qty: quantity, unitPrice, deliveryFee, amount: unitPrice * quantity + deliveryFee }
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
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: merchant.name, business_name: merchant.business, phone: merchant.phone || '', delivery_fee: Math.max(0, Number(merchant.deliveryFee || 0)) })
      if (error) return setNotice(error.message)
    }
    setNotice('Profile saved')
  }

  const saveProduct = async () => {
    if(!supabase || !session)return setNotice('Please sign in to save this product.')
    if (!productDraft.name.trim() || Number(productDraft.price) <= 0) return setNotice('Add a product name and valid price.')
    if (!Number.isInteger(Number(productDraft.stock_quantity)) || Number(productDraft.stock_quantity) < 0) return setNotice('Stock must be zero or a whole number.')
    setProductBusy(true)
    setNotice('')
    try {
      const uploadedImages = []
      if (supabase && session && productDraft.images.length) {
        for (const image of productDraft.images) {
          const extension = image.name.split('.').pop() || 'jpg'
          const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`
          const { error: uploadError } = await supabase.storage.from('product-images').upload(path, image, { upsert: false })
          if (uploadError) throw uploadError
          uploadedImages.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
        }
      }
      const imageUrls = [...productDraft.existingImages, ...uploadedImages].slice(0, 4)
      const product = { merchant_id: session?.user?.id, name: productDraft.name.trim(), description: productDraft.description.trim(), price: Number(productDraft.price), category: productDraft.category, stock_quantity: Number(productDraft.stock_quantity), image_url: imageUrls[0] || '', images: imageUrls, active: editingProduct?.active ?? true, updated_at: new Date().toISOString() }
      if (supabase && session) {
        const query = editingProduct
          ? supabase.from('products').update(product).eq('id', editingProduct.id)
          : supabase.from('products').insert(product)
        const { data, error } = await query.select().single()
        if (error) throw error
        setProducts(current => editingProduct ? current.map(item => item.id === data.id ? data : item) : [data, ...current])
      }
      setProductDraft(emptyProductDraft)
      setEditingProduct(null)
      go('products')
    } catch (error) { setNotice(error.message) } finally { setProductBusy(false) }
  }

  const editProduct = (product) => {
    setEditingProduct(product)
    setProductDraft({ name: product.name, description: product.description || '', price: String(product.price), category: product.category || 'Other', stock_quantity: String(product.stock_quantity ?? 0), images: [], existingImages: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []) })
    setNotice('')
    go('add-product')
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return
    if (supabase && session && !String(product.id).startsWith('sample-')) {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) return setNotice(error.message)
    }
    setProducts(current => current.filter(item => item.id !== product.id))
    setNotice('Product deleted')
  }

  const toggleProduct = async (product) => {
    const next = !product.active
    if (supabase && session && !String(product.id).startsWith('sample-')) {
      const { error } = await supabase.from('products').update({ active: next, updated_at: new Date().toISOString() }).eq('id', product.id)
      if (error) return setNotice(error.message)
    }
    setProducts(current => current.map(item => item.id === product.id ? { ...item, active: next } : item))
  }

  const addToCart = product => {
    const found=cart.find(entry=>entry.product.id===product.id)
    const stock=Number(product.stock_quantity || 0)
    if((found?.quantity || 0)>=stock)return setNotice('You have added all the available stock.')
    setCart(current=>found?current.map(entry=>entry.product.id===product.id?{product,quantity:entry.quantity+1}:entry):[...current,{product,quantity:1}])
    setNotice(`${product.name} added to your cart.`)
  }

  const openProduct = (product) => {
    setSelectedProduct(product)
    setProductImageIndex(0)
    setNotice('')
    go('product-details')
  }

  const changeCartQuantity = (productId, change) => setCart(current => current.map(entry => {
    if (entry.product.id !== productId) return entry
    const stock = Number(entry.product.stock_quantity ?? 999999)
    return { ...entry, quantity: Math.min(stock, Math.max(0, entry.quantity + change)) }
  }).filter(entry => entry.quantity > 0))

  const removeFromCart = (productId) => setCart(current => current.filter(entry => entry.product.id !== productId))

  const createCartOrder = async () => {
    if(checkoutLock.current)return
    if(!draft.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) || !draft.address.trim() || !cart.length)return setNotice('Add your name, a valid email and delivery address.')
    if(!supabase || !storeMerchantId)return setNotice('This store could not connect. Please try again.')
    checkoutLock.current=true;setCheckoutBusy(true);setNotice('')
    try{
      const cartPayload=cart.map(entry=>({product_id:entry.product.id,quantity:entry.quantity}))
      const fingerprint=JSON.stringify(cartPayload.slice().sort((a,b)=>a.product_id.localeCompare(b.product_id)))
      const key=`orderflow-checkout:${storeMerchantId}`
      let pending
      try{pending=JSON.parse(sessionStorage.getItem(key) || 'null')}catch{}
      if(!pending || pending.fingerprint!==fingerprint)pending={fingerprint,id:crypto.randomUUID()}
      sessionStorage.setItem(key,JSON.stringify(pending))
      const {data,error}=await supabase.rpc('create_store_checkout',{p_merchant:storeMerchantId,p_request_id:pending.id,p_name:draft.name,p_phone:draft.phone || '',p_email:draft.email,p_address:draft.address,p_cart:cartPayload,p_note:draft.note || ''}).maybeSingle()
      if(error || !data)throw Error(error?.message || 'Your order could not be created. Please try again.')
      sessionStorage.setItem(key,JSON.stringify({...pending,publicToken:data.public_token}))
      const {error:deliveryError}=await supabase.rpc('update_public_order_delivery',{p_token:data.public_token,p_name:draft.name,p_phone:draft.phone || '',p_email:draft.email,p_address:draft.address,p_note:draft.note || ''})
      if(deliveryError)throw deliveryError
      const {data:lines,error:linesError}=await supabase.rpc('get_public_order_lines',{p_token:data.public_token})
      if(linesError || !Array.isArray(lines) || !lines.length)throw Error('Your order is saved. Please try again to load its details.')
      const delivery=Number(data.delivery_fee),subtotal=Number(data.total)-delivery
      const order={id:data.order_number,publicToken:data.public_token,name:draft.name,phone:draft.phone,item:lines.map(row=>`${row.name} × ${row.quantity}`).join(', '),qty:1,unitPrice:subtotal,deliveryFee:delivery,amount:Number(data.total),address:draft.address,note:draft.note,channel:'Storefront',status:'Confirmed',createdAt:new Date().toISOString(),lineItems:lines}
      setSelected(order);setDraft(current=>({...current,item:order.item,qty:1,price:String(subtotal),delivery:String(delivery)}));go('payment')
    }catch(error){setNotice(error.message || 'Checkout could not connect. Your cart is saved; please try again.')}finally{checkoutLock.current=false;setCheckoutBusy(false)}
  }

  const saveDelivery = async () => {
    if(checkoutLock.current || !supabase || !selected?.publicToken)return
    checkoutLock.current=true;setCheckoutBusy(true);setNotice('')
    try{
      const {error}=await supabase.rpc('update_public_order_delivery',{p_token:selected.publicToken,p_name:draft.name,p_phone:draft.phone || '',p_email:draft.email,p_address:draft.address,p_note:draft.note || ''})
      if(error)throw error
      setSelected(current=>({...current,name:draft.name,phone:draft.phone,address:draft.address,note:draft.note}));go('payment')
    }catch(error){setNotice(error.message || 'Could not save delivery details. Please retry.')}finally{checkoutLock.current=false;setCheckoutBusy(false)}
  }

  const shareStore = async () => {
    if(!session?.user?.id)return
    const url=`${window.location.origin}/?store=${encodeURIComponent(session.user.id)}`
    try{
      if(navigator.share)await navigator.share({title:`${merchant.business} catalogue`,url})
      else{await navigator.clipboard.writeText(url);setNotice('Store link copied')}
    }catch(error){if(error.name!=='AbortError')setNotice('Could not share. Open your storefront and copy its address.')}
  }

  const openStorefront = () => window.location.assign(storeMerchantId ? `/?store=${encodeURIComponent(storeMerchantId)}` : '/shop')

  const signOut = async () => {
    if (supabase) {const {error}=await supabase.auth.signOut();if(error)return setNotice('Could not sign out. Please try again.')}
    setOrders([]);setProducts([]);setSelected(null);setMerchant({name:'',business:'',phone:'',email:'',deliveryFee:0})
    setSession(null)
    go('welcome')
  }

  const startPayment = async () => {
    if(paymentBusy)return
    if(!selected?.publicToken)return setNotice('Open a valid order before paying.')
    if(selected.paymentStatus==='paid')return openTracking()
    if (paymentMethod === 'opay') return setNotice('OPay setup requires approved merchant API credentials. Choose Paystack or Bank transfer for this test payment.')
    if (paymentMethod === 'escrow') {
  if (!selected?.publicToken) {
    return setNotice('Open a valid buyer order link to use protected payment.')
  }

  window.location.assign(
    `/protected-payment?order=${encodeURIComponent(selected.publicToken)}`
  )
  return
}
    setPaymentBusy(true)
    setNotice('')
    try {
      sessionStorage.setItem('orderflow-buyer-order', JSON.stringify({ selected, draft, merchant: { business: merchant.business, phone: merchant.phone }, storeMerchantId, cart }))
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: draft.email || auth.email || session?.user?.email || merchant.email,
          orderId: selected.id,
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

  if (screen === 'account-error') return <AppShell onBack={go}><section className="ux-payment-success"><h1>We couldn’t open your workspace</h1><p role="alert">{notice}</p><button onClick={()=>window.location.reload()}>Try again</button><button className="secondary" onClick={signOut}>Sign out</button></section></AppShell>

  if (screen === 'payment-check') return <AppShell onBack={go} title="Payment status"><section className="ux-payment-success">
    <span className="ux-success-icon"><Icon name="clock"/></span><h1>{paymentBusy?'Checking your payment…':'Let’s confirm your payment'}</h1><p>{paymentBusy?'We’re waiting for the payment confirmation.': 'If you have already paid, check the status again before starting another payment.'}</p>
    {notice&&<p className="notice" role="status">{notice}</p>}<button disabled={paymentBusy} className="ux-primary" onClick={()=>setVerificationAttempt(n=>n+1)}>{paymentBusy?'Checking…':'Check payment status'}</button>
    {new URLSearchParams(typeof window!=='undefined'?window.location.search:'').get('order')&&<a className="ux-secondary" href={`/?track=${encodeURIComponent(new URLSearchParams(window.location.search).get('order'))}`}>Open order tracking</a>}<p className="ux-muted ux-order-id">Reference: {paymentReference}</p>
  </section></AppShell>

  if (screen === 'splash') return <main className="splash"><OrderFlowLogo /><p>Orders made simple.</p><div className="splash-pulse" /></main>

  if (screen === 'public-loading') return <main className="splash"><OrderFlowLogo /><p>{publicOrderLoading ? 'Opening your secure order…' : 'Loading order…'}</p><div className="splash-pulse" /></main>

  if (screen === 'public-error') return <AppShell onBack={go}><section className="success"><div className="order-link-error">!</div><h1>Order unavailable</h1><p>{notice || 'This order link is invalid or has expired.'}</p><button onClick={() => { window.history.replaceState({}, '', window.location.pathname); go('welcome') }}>Go to OrderFlow</button></section></AppShell>


  if (screen === 'welcome') return <AppShell onBack={go}><section className="welcome"><div className="welcome-brand"><OrderFlowLogo compact /></div><h1>Welcome to OrderFlow</h1><p>Find something you love, or grow your business. How would you like to start?</p><div className="role-choice"><a href="/buyer?mode=signup">I’m a buyer<small>Explore stores and shop your favourites.</small></a><button type="button" onClick={() => go('signup')}>I’m a merchant<small>Create your store and manage orders.</small></button></div><a className="buyer-role-link" href="/shop">Browse stores</a><button className="secondary" onClick={() => go('signin')}>Merchant sign in</button><a className="buyer-role-link" href="/buyer">Buyer sign in</a><div className="auth-soft-design"><span>Discover</span><span>Shop</span><span>Keep track</span></div></section></AppShell>

  if (screen === 'signup') return <AppShell onBack={go} back="welcome" title="Create your account"><section className="form auth-form"><div className="auth-intro"><a className="buyer-role-link" href="/buyer?mode=signup">Shopping? Create a buyer account →</a><h1>Let’s get you started</h1><p>Set up your store and start turning conversations into paid orders.</p></div><button className="social google-button" onClick={signInWithGoogle}><GoogleIcon /><span>Continue with Google</span></button><div className="or"><span>or create an account with email</span></div>{authField('name','Full name','text','Your full name')}{authField('email','Email address','email','you@business.com')}{authField('password','Password','password','At least 8 characters')}{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.name || !auth.email || auth.password.length < 8} onClick={signUp}>{authBusy ? 'Creating account…' : 'Continue'}</button><div className="auth-soft-design"><span>Simple setup</span><span>Secure payments</span><span>Live tracking</span></div><p className="center auth-switch">Already have an account? <a onClick={() => go('signin')}>Sign in</a></p></section></AppShell>

  if (screen === 'signin') return <AppShell onBack={go} back="welcome"><section className="form auth-form"><div className="auth-logo"><OrderFlowLogo compact /></div><div className="auth-intro"><a className="buyer-role-link" href="/buyer">Shopping? Sign in as a buyer →</a><h1>Welcome back</h1><p>Sign in to manage orders, buyers and payments.</p></div><button className="social google-button" onClick={signInWithGoogle}><GoogleIcon /><span>Continue with Google</span></button><div className="or"><span>or continue with email</span></div>{authField('email','Email address','email','you@business.com')}<label><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} value={auth.password} placeholder="Your password" onChange={event => setAuth({ ...auth, password: event.target.value })}/><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label><div className="signin-options"><label className="remember"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)}/><span>Remember me</span></label><button type="button" className="text-button" onClick={resetPassword}>Forgot password?</button></div>{notice && <div className="notice">{notice}</div>}<button disabled={authBusy || !auth.email || !auth.password} onClick={signIn}>{authBusy ? 'Signing in…' : 'Sign in'}</button><div className="auth-soft-design"><span>Your orders</span><span>Your buyers</span><span>One clear view</span></div><p className="center auth-switch">New to OrderFlow? <a onClick={() => go('signup')}>Create an account</a></p></section></AppShell>

  if (screen === 'setup') return <AppShell onBack={go} back="signup" title="Set up your business"><section className="form"><h1>Make OrderFlow yours</h1><label><span>Business name</span><input value={merchant.business} onChange={e => setMerchant({ ...merchant, business: e.target.value })} /></label><label><span>WhatsApp business number</span><input type="tel" value={merchant.phone} onChange={e=>setMerchant({...merchant,phone:e.target.value})} placeholder="0801 234 5678" /></label>{notice && <div className="notice">{notice}</div>}<button onClick={completeSetup}>Complete setup</button></section></AppShell>

  if (screen === 'dashboard') return <AppShell onBack={go} merchantHeader merchantName={merchant.name} onNotifications={() => go('orders')} onProfile={() => go('profile')}>
    <VendorOverview merchant={{...merchant,id:session?.user?.id}} orders={orders} products={products} onNavigate={go} onOrder={order=>{setSelected(order);go('merchant-order')}} onEditProduct={editProduct} onShare={shareStore} notice={notice || accountError}/>
    <MerchantNav active="dashboard" onNavigate={go}/>
  </AppShell>


  if (screen === 'products') return <AppShell onBack={go} back="dashboard" title="Products"><section className="dashboard products-screen"><div className="catalogue-head"><div><h1>Your catalogue</h1><p>Manage what buyers see, pricing and available stock.</p></div><button onClick={() => { setEditingProduct(null); setProductDraft(emptyProductDraft); go('add-product') }}>+ Add product</button></div><div className="store-share-card"><span><b>Your public store</b><small>Share one link for buyers to browse and checkout.</small></span><button className="secondary" onClick={shareStore}>Copy or share link</button></div>{notice && <div className="notice">{notice}</div>}<div className="merchant-product-grid">{products.map(product => <article className={`merchant-product-card${product.active === false ? ' unavailable' : ''}`} key={product.id}><div className="product-image"><ProductPhoto product={product}/>{Number(product.stock_quantity ?? 1) === 0 && <span className="stock-badge sold-out">Out of stock</span>}{product.active === false && <span className="stock-badge hidden">Hidden</span>}</div><div><small>{product.category}</small><h3>{product.name}</h3><strong>{naira.format(product.price)}</strong><span className="stock-line">{Number(product.stock_quantity ?? 0)} in stock</span><div className="product-actions"><button className="secondary" onClick={() => editProduct(product)}>Edit</button><button className="secondary" onClick={() => toggleProduct(product)}>{product.active === false ? 'Show' : 'Hide'}</button><button className="danger-link" onClick={() => deleteProduct(product)}>Delete</button></div></div></article>)}</div></section><MerchantNav active="products" onNavigate={go}/></AppShell>

  if (screen === 'add-product') return <AppShell onBack={go} back="products" title={editingProduct ? 'Edit product' : 'Add product'}><section className="form product-form"><h1>{editingProduct ? 'Update product' : 'Add to your catalogue'}</h1><p>Use clear details and up to four photos buyers can trust.</p><label><span>Product photos</span><input type="file" accept="image/*" multiple onChange={event => setProductDraft({ ...productDraft, images: Array.from(event.target.files || []).slice(0, 4) })}/><small>{productDraft.existingImages.length ? `${productDraft.existingImages.length} saved photo${productDraft.existingImages.length > 1 ? 's' : ''}. New photos will be added.` : 'Choose up to four images.'}</small></label><label><span>Product name</span><input value={productDraft.name} placeholder="e.g. Classic handbag" onChange={event => setProductDraft({ ...productDraft, name: event.target.value })}/></label><label><span>Short description</span><input value={productDraft.description} placeholder="What should the buyer know?" onChange={event => setProductDraft({ ...productDraft, description: event.target.value })}/></label><div className="two"><label><span>Price</span><input type="number" min="0" value={productDraft.price} placeholder="₦ 0" onChange={event => setProductDraft({ ...productDraft, price: event.target.value })}/></label><label><span>Stock quantity</span><input type="number" min="0" step="1" value={productDraft.stock_quantity} placeholder="0" onChange={event => setProductDraft({ ...productDraft, stock_quantity: event.target.value })}/></label></div><label><span>Category</span><select value={productDraft.category} onChange={event => setProductDraft({ ...productDraft, category: event.target.value })}><option>Fashion</option><option>Beauty</option><option>Food & drinks</option><option>Electronics</option><option>Home & living</option><option>Health</option><option>Services</option><option>Other</option></select></label>{notice && <div className="notice">{notice}</div>}<button disabled={productBusy} onClick={saveProduct}>{productBusy ? 'Saving product…' : editingProduct ? 'Save changes' : 'Add product'}</button></section><MerchantNav active="products" onNavigate={go}/></AppShell>

  if (screen === 'store') return <AppShell onBack={go}><section className="storefront"><a className="ux-back-link" href="/shop"><Icon name="back"/>Explore all stores</a><div className="store-hero"><div className="store-identity"><div className="avatar store-avatar">{merchant.business.slice(0,2).toUpperCase()}</div><div><small>Welcome to</small><h1>{merchant.business}</h1><p>Good products, secure checkout and order updates you can follow.</p></div></div><div className="store-trust"><span>Secure payment</span><span>Track your order</span><span>Seller support</span></div></div><StoreAccount session={session} store={storeMerchantId} business={merchant.business} cart={cart} onCart={()=>go('cart')} onSignOut={async()=>{const {error}=await supabase.auth.signOut();if(error){setNotice(error.message);return}setSession(null)}}/><input aria-label="Search this store" className="search store-search" type="search" value={storeSearch} onChange={event => setStoreSearch(event.target.value)} placeholder="What are you looking for?"/><div className="category-row" aria-label="Product categories">{storeCategories.map(category => <button key={category} className={storeCategory === category ? 'active' : ''} onClick={() => setStoreCategory(category)}>{category}</button>)}</div>{notice && <div className="notice">{notice}</div>}<div className="store-section-heading"><div><small>Shop the catalogue</small><h2>{storeCategory === 'All' ? 'Available products' : storeCategory}</h2></div><span>{visibleProducts.length} item{visibleProducts.length === 1 ? '' : 's'}</span></div><div className="store-product-grid">{visibleProducts.map(product => { const soldOut = Number(product.stock_quantity ?? 1) === 0; return <article className={`store-product-card${soldOut ? ' unavailable' : ''}`} key={product.id}><button className="product-open" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}><div className="product-image"><ProductPhoto product={product}/>{soldOut && <span className="stock-badge sold-out">Out of stock</span>}</div></button><small>{product.category}</small><button className="product-name" onClick={() => openProduct(product)}>{product.name}</button><p>{product.description}</p><div><span><strong>{naira.format(product.price)}</strong>{!soldOut && Number(product.stock_quantity) <= 5 && <small>Only {product.stock_quantity} left</small>}</span><button disabled={soldOut} onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>{soldOut ? '×' : '+'}</button></div></article>})}{visibleProducts.length === 0 && <div className="empty-state"><strong>No products here yet</strong><span>Try another category or search.</span></div>}</div>{merchant.phone && <a className="seller-help" href={`https://wa.me/${merchant.phone.replace(/\D/g, '').replace(/^0/, '234')}`} target="_blank" rel="noreferrer">Need help choosing? Chat with {merchant.business}</a>}{cart.length > 0 && <button className="floating-cart" onClick={() => go('cart')}><span>View cart · {cart.reduce((sum, entry) => sum + entry.quantity, 0)} item{cart.reduce((sum, entry) => sum + entry.quantity, 0) === 1 ? '' : 's'}</span><b>{naira.format(cartTotal)}</b></button>}</section><BuyerNav active="shop" count={cart.reduce((n,row)=>n+row.quantity,0)}/></AppShell>

  if (screen === 'product-details' && selectedProduct) { const images = selectedProduct.images?.length ? selectedProduct.images : [selectedProduct.image_url || '']; const soldOut = Number(selectedProduct.stock_quantity ?? 1) === 0; return <AppShell onBack={go} back="store" title="Product details"><section className="product-detail"><div className="detail-image" style={{ backgroundImage: `url(${images[productImageIndex] || images[0]})` }}>{soldOut && <span className="stock-badge sold-out">Out of stock</span>}</div>{images.length > 1 && <div className="image-thumbnails">{images.map((image, index) => <button key={image} className={productImageIndex === index ? 'active' : ''} onClick={() => setProductImageIndex(index)} style={{ backgroundImage: `url(${image})` }} aria-label={`View image ${index + 1}`}/>)}</div>}<div className="detail-copy"><small>{selectedProduct.category}</small><h1>{selectedProduct.name}</h1><strong>{naira.format(selectedProduct.price)}</strong><p>{selectedProduct.description || 'Contact the seller if you would like more information about this product.'}</p><div className={`availability${soldOut ? ' sold-out' : ''}`}><span>{soldOut ? 'Out of stock' : 'Available now'}</span>{!soldOut && <small>{selectedProduct.stock_quantity} in stock</small>}</div></div>{notice && <div className="notice">{notice}</div>}<div className="detail-actions"><button className="secondary" onClick={() => go('store')}>Keep shopping</button><button disabled={soldOut} onClick={() => addToCart(selectedProduct)}>{soldOut ? 'Currently unavailable' : 'Add to cart'}</button></div>{cart.length > 0 && <button className="link" onClick={() => go('cart')}>View your cart · {naira.format(cartTotal)}</button>}<div className="buyer-assurance"><span><b>Secure checkout</b><small>Payment is processed safely.</small></span><span><b>Order tracking</b><small>Follow every delivery update.</small></span></div></section></AppShell> }

  if (screen === 'cart') return <AppShell onBack={go} back="store" title="Your cart"><section className="form cart-screen"><div className="section-title"><div><small>Review your order</small><h1>Your cart</h1></div><span>{cart.reduce((sum, entry) => sum + entry.quantity, 0)} item{cart.reduce((sum, entry) => sum + entry.quantity, 0) === 1 ? '' : 's'}</span></div>{cart.length === 0 ? <div className="empty-cart"><NavIcon type="products"/><h2>Your cart is empty</h2><p>Browse the catalogue and add something you like.</p><button onClick={() => go('store')}>Continue shopping</button></div> : <>{cart.map(entry => <article className="cart-item refined" key={entry.product.id}><button className="cart-product-image product-image" onClick={() => openProduct(entry.product)} style={{ backgroundImage: `url(${entry.product.image_url || ''})` }} aria-label={`View ${entry.product.name}`}/><div className="cart-item-copy"><small>{entry.product.category}</small><h3>{entry.product.name}</h3><strong>{naira.format(Number(entry.product.price) * entry.quantity)}</strong><div className="cart-item-controls"><div className="quantity-control"><button onClick={() => changeCartQuantity(entry.product.id, -1)} aria-label="Reduce quantity">−</button><span>{entry.quantity}</span><button disabled={entry.quantity >= Number(entry.product.stock_quantity ?? 999999)} onClick={() => changeCartQuantity(entry.product.id, 1)} aria-label="Increase quantity">+</button></div><button className="remove-item" onClick={() => removeFromCart(entry.product.id)}>Remove</button></div></div></article>)}<div className="checkout-summary"><h2>Order summary</h2><p><span>Subtotal</span><b>{naira.format(cartTotal)}</b></p><p><span>Delivery fee</span><b>{Number(merchant.deliveryFee || 0) > 0 ? naira.format(merchant.deliveryFee) : 'Free'}</b></p><p className="checkout-total"><span>Total</span><b>{naira.format(cartTotal + Number(merchant.deliveryFee || 0))}</b></p><small>Delivery fee is set by {merchant.business}.</small></div><button onClick={() => go('store-delivery')}>Continue to delivery</button><button className="link" onClick={() => go('store')}>Add more items</button></>}</section></AppShell>




  if (screen === 'orders') return <AppShell onBack={go} back="dashboard" title="All orders"><section className="dashboard orders-screen"><div className="orders-summary"><span><b>{orders.length}</b> total</span><span><b>{orderStats.awaiting}</b> awaiting</span><span><b>{orderStats.active}</b> active</span></div><input className="search" type="search" value={orderSearch} onChange={event => setOrderSearch(event.target.value)} placeholder="Search order, buyer, phone or item"/><div className="filter-row" aria-label="Filter orders">{['All','Pending','Confirmed','Paid','Out for delivery','Delivered','Cancelled'].map(filter => <button key={filter} className={orderFilter === filter ? 'active' : ''} onClick={() => setOrderFilter(filter)}>{filter}</button>)}</div><div className="orders order-list">{filteredOrders.map(order => <button className="order" key={order.id} onClick={() => { setSelected(order); go('merchant-order') }}><div><b>{order.id} · {order.name}</b><span>{order.item} × {order.qty} · {naira.format(order.amount)}</span><small>{orderDate.format(new Date(order.createdAt || Date.now()))}</small></div><em className={order.status.toLowerCase().replaceAll(' ','-')}>{order.status}</em></button>)}{filteredOrders.length === 0 && <div className="empty-state"><strong>No matching orders</strong><span>Try another search or status filter.</span></div>}</div><button className="orders-create" onClick={() => go('create')}>+ Create new order</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'create') return <AppShell onBack={go} back="dashboard" title="Create order"><section className="form"><p className="step">Step 1 of 2 · Order details</p>{field('name','Customer name','text','Enter customer’s name')}{field('phone','Phone number','tel','0801 234 5678')}<ItemRows items={newItems} onChange={setNewItems}/>{field('delivery','Delivery fee','number','₦ 0.00')}<div className="total"><span>Order total</span><b>{naira.format(total)}</b></div><button disabled={!draft.name.trim() || !validItems(newItems) || total<=0} onClick={() => go('review')}>Continue</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'review') return <AppShell onBack={go} back="create" title="Review order"><section className="form"><p className="step">Step 2 of 2 · Check before sharing</p><article className="card"><small>CUSTOMER</small><h3>{draft.name}</h3><p>{draft.phone}</p></article><h2>Order summary</h2><article className="card rows">{newItems.map((item,index)=><p key={index}><span>{item.name} × {item.quantity}{item.note&&<small className="item-note-copy">{item.note}</small>}</span><b>{naira.format(Number(item.unit_price)*Number(item.quantity))}</b></p>)}<p><span>Delivery fee</span><b>{naira.format(Number(draft.delivery || 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total)}</b></p></article>{notice && <div className="notice">{notice}</div>}<button disabled={checkoutBusy} onClick={saveOrder}>{checkoutBusy ? 'Creating order…' : 'Create secure order link'}</button><button className="secondary" onClick={()=>go('create')}>Edit details</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'link') {
    const orderId = selected?.id || ''
    const publicToken = selected?.publicToken || orderId
    const orderLink = typeof window === 'undefined' ? '' : `${window.location.origin}/?order=${encodeURIComponent(publicToken)}`
    const shareOnWhatsApp = () => {
      const message = `Hi ${draft.name || 'there'}, ${merchant.business} has created order ${orderId} for ${draft.item || 'your item'}. Total: ${naira.format(total || selected?.amount || 0)}. Review your order here: ${orderLink}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    }
    return <AppShell onBack={go}><section className="success"><div className="check">✓</div><h1>Order link is ready!</h1><p>Send this secure link to {draft.name || 'your customer'} so they can review and confirm the order.</p><div className="copy"><span>{orderLink}</span><button onClick={async () => { try { await navigator.clipboard.writeText(orderLink); setNotice('Link copied') } catch { setNotice('Copy the link above') } }}>Copy</button></div>{notice && <div className="notice">{notice}</div>}<button className="whatsapp" onClick={shareOnWhatsApp}>Share on WhatsApp</button><button className="secondary" onClick={async () => { if (navigator.share) await navigator.share({ title: `Order ${orderId}`, text: `Review your order from ${merchant.business}`, url: orderLink }); else { await navigator.clipboard.writeText(orderLink); setNotice('Link copied—share it with your buyer.') } }}>Share another way</button><button className="link" onClick={() => go('dashboard')}>Back to dashboard</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>
  }

  if (screen === 'confirm') return <AppShell onBack={go}><section className="form buyer-checkout"><div className="brand center">OrderFlow</div><div className="buyer-welcome"><small>Secure order from {merchant.business}</small><h1>Hi {draft.name || 'there'}, your order is ready to review.</h1><p>Everything is clearly listed below. Confirm when you are happy to continue.</p></div><article className="card rows"><p><span>Order from</span><b>{merchant.business}</b></p><p><span>Order number</span><b>{selected?.id || ''}</b></p>{selected?.lineItems?.length ? selected.lineItems.map((item,index)=><p key={index}><span>{item.name} × {item.quantity}{item.note&&<small className="item-note-copy">{item.note}</small>}</span><b>{naira.format(Number(item.unit_price)*Number(item.quantity))}</b></p>) : <p><span>{draft.item || 'Your item'} × {draft.qty}</span><b>{naira.format(Number(draft.price || 0) * Number(draft.qty || 1))}</b></p>}<p><span>Delivery</span><b>{naira.format(Number(draft.delivery || 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(total || selected?.amount || 0)}</b></p></article><div className="buyer-trust"><span>✓ Secure checkout</span><span>✓ Live delivery updates</span></div>{notice && <div className="notice">{notice}</div>}<button onClick={confirmBuyerOrder}>{selected?.status === 'Confirmed' ? 'Continue to delivery' : 'Confirm order details'}</button><button className="secondary" onClick={() => setNotice('Please contact the seller using the WhatsApp message you received and describe the correction needed.')}>Request a correction</button></section></AppShell>

  if (screen === 'delivery' || screen === 'store-delivery') {
    const fromCart = screen === 'store-delivery'
    const items = fromCart ? cart : selected?.lineItems?.length ? selected.lineItems : [{name:selected?.item,quantity:selected?.qty || 1,unit_price:selected?.unitPrice || 0}]
    const subtotal = fromCart ? cartTotal : Number(selected?.unitPrice || 0) * Number(selected?.qty || 1)
    const delivery = fromCart ? Number(merchant.deliveryFee || 0) : Number(selected?.deliveryFee || 0)
    return <AppShell onBack={go} back={fromCart ? 'cart' : 'confirm'} title="Checkout"><section className="ux-checkout">
      <div className="ux-heading"><div><span className="ux-eyebrow">One more step</span><h1>Make it yours.</h1><p>Add your delivery details, then choose how to pay.</p></div></div>
      <div className="ux-checkout-grid"><form className="ux-panel ux-delivery-form" onSubmit={event=>{event.preventDefault();fromCart ? createCartOrder() : saveDelivery()}}>
        <h2>Delivery details</h2><p className="ux-muted">For your order from {merchant.business}.</p>
        <label>Full name<input required autoComplete="name" maxLength={120} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
        <div className="ux-field-pair"><label>Phone number <small>(optional)</small><input type="tel" autoComplete="tel" maxLength={40} value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label><label>Email address<input required type="email" autoComplete="email" maxLength={254} value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label></div>
        <label>Delivery address<textarea required autoComplete="street-address" rows={2} maxLength={1000} placeholder="House number, street, area and city" value={draft.address} onChange={e=>setDraft({...draft,address:e.target.value})}/></label>
        <details className="ux-note"><summary>Add a note for the seller <span>(optional)</span></summary><label className="ux-sr-only" htmlFor="buyer-note">Note for the seller</label><textarea id="buyer-note" rows={2} maxLength={1000} placeholder="Anything else the seller should know?" value={draft.note || ''} onChange={e=>setDraft({...draft,note:e.target.value})}/></details>
        {notice && <p role="alert" className="notice">{notice}</p>}<button disabled={checkoutBusy || (fromCart && !cart.length)} type="submit" className="ux-primary">{checkoutBusy ? 'Saving your order…' : 'Continue to payment'}<Icon name="arrow"/></button><small className="ux-muted">You’ll review the amount before paying.</small>
      </form><CheckoutSummary business={merchant.business} items={items} subtotal={subtotal} delivery={delivery}/></div>
    </section></AppShell>
  }


  if (screen === 'payment') return <AppShell onBack={go} back={selected?.channel==='Storefront' ? 'store-delivery' : 'delivery'} title="Payment"><section className="ux-checkout">
    <div className="ux-heading"><div><span className="ux-eyebrow">Checkout</span><h1>Choose how to pay.</h1><p>Your order from {merchant.business} is ready.</p></div></div>
    <div className="ux-checkout-grid"><div className="ux-panel ux-payment-options"><h2>Payment method</h2>
      {[['paystack','Paystack checkout','Choose an available payment method on Paystack.'],['bank-transfer','Bank transfer','Use the account details provided by Paystack.'],['escrow','Protected payment · Test','Try the protected-payment flow using test funds.']].map(([value,label,detail])=><label key={value} className={`choice ${paymentMethod===value?'selected':''}`}><input type="radio" name="payment" value={value} checked={paymentMethod===value} onChange={()=>{setPaymentMethod(value);setNotice('')}}/><span><b>{label}</b><small>{detail}</small></span></label>)}
      {notice && <p role="alert" className="notice">{notice}</p>}<button disabled={paymentBusy} className="ux-primary" onClick={startPayment}>{paymentBusy ? 'Opening payment…' : paymentMethod==='escrow' ? 'Continue to protected payment' : `Pay ${naira.format(selected?.amount || total)}`}<Icon name="arrow"/></button><p className="ux-muted">Payment status updates after Paystack confirms your transaction.</p>
    </div><CheckoutSummary business={merchant.business} items={selected?.lineItems?.length ? selected.lineItems : [{name:selected?.item,quantity:selected?.qty||1,unit_price:selected?.unitPrice||0}]} subtotal={Number(selected?.unitPrice||0)*Number(selected?.qty||1)} delivery={selected?.deliveryFee || 0} total={selected?.amount || total}><div className="ux-address"><b>Deliver to {draft.name}</b><p>{draft.address}</p><button className="ux-text" onClick={()=>go(selected?.channel==='Storefront'?'store-delivery':'delivery')}>Edit details</button></div></CheckoutSummary></div>
  </section></AppShell>


  if (screen === 'paid' && selected?.paymentStatus==='paid') return <AppShell onBack={go}><section className="ux-payment-success">
    <span className="ux-success-icon"><Icon name="check"/></span><span className="ux-eyebrow">Payment confirmed</span><h1>You’re all set, {draft.name?.split(' ')[0] || 'thank you'}.</h1><p>Your payment for {merchant.business} has been confirmed. Follow your order from here.</p>
    <CheckoutSummary business={merchant.business} items={selected.lineItems?.length?selected.lineItems:[{name:selected.item,quantity:selected.qty,unit_price:selected.unitPrice}]} subtotal={Number(selected.unitPrice)*Number(selected.qty||1)} delivery={selected.deliveryFee} total={selected.amount}><div className="ux-receipt-meta"><span>Order <b>{selected.id}</b></span>{paymentReference&&<span>Payment reference <code>{paymentReference}</code></span>}</div></CheckoutSummary>
    <button className="ux-primary" onClick={openTracking}>Track my order <Icon name="arrow"/></button><div className="ux-field-pair"><button className="ux-secondary" onClick={shareTrackingLink}>Save tracking link</button><button className="ux-secondary" onClick={contactSeller}>Contact seller</button></div>
    {!session && <a className="ux-save-account" href={`/buyer?save=${encodeURIComponent(selected.publicToken)}&next=orders`}>Save this order to a buyer account <Icon name="arrow"/></a>}
    <button className="ux-text" onClick={openStorefront}>Continue shopping</button>{notice&&<p role="status" className="notice">{notice}</p>}
  </section><BuyerNav active="orders" count={cart.reduce((n,row)=>n+row.quantity,0)}/></AppShell>


  if (screen === 'tracking' && selected) return <AppShell onBack={go} title="Order updates">
    <TrackingView order={selected} business={merchant.business} connection={trackingConnection} onRetry={refreshTracking} onShare={shareTrackingLink} onContact={contactSeller} onShop={openStorefront} onPay={confirmBuyerOrder} notice={notice}/>
    <BuyerNav active="orders" count={cart.reduce((n,row)=>n+row.quantity,0)}/>
  </AppShell>


  if (screen === 'profile') return <AppShell onBack={go} back="dashboard" title="Business"><section className="form profile-form"><FeatureBanner type="profile" /><div className="profile-head"><span className="avatar profile-avatar">{merchant.name.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase()}</span><div><h1>{merchant.name}</h1><p>{merchant.business}</p></div></div><label><span>Full name</span><input value={merchant.name} onChange={event => setMerchant({ ...merchant, name: event.target.value })}/></label><label><span>Business name</span><input value={merchant.business} onChange={event => setMerchant({ ...merchant, business: event.target.value })}/></label><label><span>Email address</span><input type="email" value={merchant.email || session?.user?.email || ''} onChange={event => setMerchant({ ...merchant, email: event.target.value })}/></label><label><span>Phone number</span><input type="tel" value={merchant.phone || ''} placeholder="0801 234 5678" onChange={event => setMerchant({ ...merchant, phone: event.target.value })}/></label><label><span>Storefront delivery fee</span><input type="number" min="0" value={merchant.deliveryFee || ''} placeholder="₦ 0 for free delivery" onChange={event => setMerchant({ ...merchant, deliveryFee: event.target.value })}/><small>This fixed fee will be added to storefront orders.</small></label>{notice && <div className="notice">{notice}</div>}<div className="profile-actions"><button onClick={saveProfile}>Save profile</button><button className="secondary" onClick={signOut}>Sign out</button></div></section><MerchantNav active="profile" onNavigate={go}/></AppShell>

  if (screen === 'edit-order' && editingOrder) return <AppShell onBack={go} back="merchant-order" title="Edit order"><section className="form"><label><span>Customer name</span><input value={editingOrder.name} onChange={event => setEditingOrder({ ...editingOrder, name: event.target.value })}/></label><label><span>Phone number</span><input type="tel" value={editingOrder.phone || ''} onChange={event => setEditingOrder({ ...editingOrder, phone: event.target.value })}/></label>{editingOrder.lineItems?.length ? <ItemRows items={editingOrder.lineItems} onChange={items=>setEditingOrder({...editingOrder,lineItems:items})}/> : <><label><span>Item or service</span><input value={editingOrder.item} onChange={event => setEditingOrder({ ...editingOrder, item: event.target.value })}/></label><div className="two"><label><span>Quantity</span><input type="number" min="1" value={editingOrder.qty} onChange={event => setEditingOrder({ ...editingOrder, qty: event.target.value })}/></label><label><span>Unit price</span><input type="number" min="0" value={editingOrder.unitPrice} onChange={event => setEditingOrder({ ...editingOrder, unitPrice: event.target.value })}/></label></div></>}<label><span>Delivery fee</span><input type="number" min="0" value={editingOrder.deliveryFee} onChange={event => setEditingOrder({ ...editingOrder, deliveryFee: event.target.value })}/></label><div className="total"><span>Updated total</span><b>{naira.format((editingOrder.lineItems?.length ? itemTotal(editingOrder.lineItems) : Number(editingOrder.unitPrice || 0) * Number(editingOrder.qty || 1)) + Number(editingOrder.deliveryFee || 0))}</b></div>{notice && <div className="notice">{notice}</div>}<button onClick={saveOrderEdits}>Save changes</button><button className="secondary" onClick={() => go('merchant-order')}>Cancel editing</button></section><MerchantNav active="orders" onNavigate={go}/></AppShell>

  if (screen === 'merchant-order') return <AppShell onBack={go} back="orders" title={`Order ${selected.id}`}><section className="form"><p className="step">Created {orderDate.format(new Date(selected.createdAt || Date.now()))}</p><article className="card"><small>CUSTOMER</small><h3>{selected.name}</h3><p>{selected.phone || 'No phone number added'}</p></article><article className="card rows">{selected.lineItems?.length ? selected.lineItems.map((item,index)=><p key={index}><span>{item.name} × {item.quantity}{item.note&&<small className="item-note-copy">{item.note}</small>}</span><b>{naira.format(Number(item.unit_price)*Number(item.quantity))}</b></p>) : <p><span>{selected.item} × {selected.qty}</span><b>{naira.format(Number(selected.unitPrice ?? ((selected.amount - Number(selected.deliveryFee || 0)) / Number(selected.qty || 1))) * Number(selected.qty || 1))}</b></p>}<p><span>Delivery</span><b>{naira.format(Number(selected.deliveryFee ?? 0))}</b></p><p className="strong"><span>Total</span><b>{naira.format(selected.amount)}</b></p></article>{selected.address&&<article className="card"><small>DELIVERY ADDRESS</small><p>{selected.address}</p>{selected.note&&<><small>BUYER NOTE</small><p>{selected.note}</p></>}</article>}<p className="ux-muted">Payment confirmation updates automatically. Update delivery progress when it changes.</p><label><span>Update progress</span><select value={statusDraft || selected.status} onChange={e=>setStatusDraft(e.target.value)}><option>Pending</option><option>Confirmed</option><option disabled={selected.paymentStatus!=='paid'}>Payment received</option><option>Out for delivery</option><option>Delivered</option><option>Cancelled</option></select></label><button onClick={updateOrderStatus}>Update order status</button>{selected.paymentStatus!=='paid' && <button className="secondary" onClick={openOrderEditor}>Edit order details</button>}{selected.status !== 'Cancelled' && selected.status !== 'Delivered' && <button className="danger-button" onClick={cancelOrder}>Cancel order</button>}{notice&&<div className="notice">{notice}</div>}</section><MerchantNav active="merchant-order" onNavigate={go}/></AppShell>

  return null
}
