'use client'
import {useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
import {Icon,money} from './experience'

export const states=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']
function readLocation(){try{return JSON.parse(localStorage.getItem('orderflow-delivery-location')||'{}')}catch{return {}}}
function saveLocation(value){try{localStorage.setItem('orderflow-delivery-location',JSON.stringify({state:value.state,area:value.area}));window.dispatchEvent(new Event('orderflow-location'))}catch{}}
export async function suggestCurrentLocation(){
 if(!navigator.geolocation)throw Error('Location is unavailable on this device. Select your state and area below.')
 const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,()=>reject(Error('Location was not shared. You can still enter your area below.')),{timeout:12000,maximumAge:60000}))
 const {latitude,longitude}=position.coords
 const response=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,{signal:AbortSignal.timeout(12000),referrerPolicy:'no-referrer'})
 if(!response.ok)throw Error('We could not find your area. Enter it below.')
 const data=await response.json()
 if(data.countryCode!=='NG')throw Error('Delivery currently uses Nigerian addresses. Select your delivery address below.')
 const raw=String(data.principalSubdivision||'').replace(/ state$/i,'')
 return {state:states.find(s=>s.toLowerCase()===raw.toLowerCase())||'',area:data.locality||data.city||''}
}

function Appearance(){
 const [theme,setTheme]=useState('system')
 useEffect(()=>{
 const media=window.matchMedia('(prefers-color-scheme: dark)')
 const apply=()=>{let value='system';try{value=localStorage.getItem('orderflow-theme')||'system'}catch{};if(!['light','dark','system'].includes(value))value='system';setTheme(value);document.documentElement.dataset.theme=value==='system'?(media.matches?'dark':'light'):value}
 apply();media.addEventListener('change',apply);window.addEventListener('storage',apply);window.addEventListener('orderflow-theme',apply)
 return()=>{media.removeEventListener('change',apply);window.removeEventListener('storage',apply);window.removeEventListener('orderflow-theme',apply)}
 },[])
 return <fieldset className="it-appearance"><legend>Appearance</legend><div>{['light','dark','system'].map(value=><button key={value} type="button" aria-pressed={theme===value} onClick={()=>{try{localStorage.setItem('orderflow-theme',value)}catch{};setTheme(value);document.documentElement.dataset.theme=value==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):value;window.dispatchEvent(new Event('orderflow-theme'))}}><Icon name={value==='light'?'sun':value==='dark'?'moon':'system'}/>{value}</button>)}</div></fieldset>
}

export function HeaderActions({role='buyer',onNavigate}){
 const [panel,setPanel]=useState(''),[session,setSession]=useState(null),[rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[unread,setUnread]=useState(0)
 const [toast,setToast]=useState(null);const seenNotices=useRef(null)
 const root=useRef(null),menuButton=useRef(null),bellButton=useRef(null),panelRef=useRef(null)
 useEffect(()=>{if(!supabase)return;let active=true;supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)});const {data}=supabase.auth.onAuthStateChange((_,next)=>setSession(next));return()=>{active=false;data.subscription.unsubscribe()}},[])
 useEffect(()=>{setRows([]);setUnread(0);setToast(null);setError('');seenNotices.current=null},[session?.user?.id,role])
 useEffect(()=>{let cancelled=false,pending=false;if(!session||!supabase){setRows([]);setUnread(0);seenNotices.current=null;return}
 async function refresh(){if(pending||document.hidden)return;pending=true;try{
 if(role==='merchant'){
 const [list,count]=await Promise.all([supabase.from('vendor_notifications').select('id,order_id,title,body,read_at,created_at').eq('merchant_id',session.user.id).order('created_at',{ascending:false}).limit(50),supabase.from('vendor_notifications').select('id',{count:'exact',head:true}).eq('merchant_id',session.user.id).is('read_at',null)])
 if(list.error||count.error)throw Error('Notifications could not refresh. Please try again.');if(!cancelled){const incoming=list.data||[];if(seenNotices.current){const fresh=incoming.find(r=>!seenNotices.current.has(r.id)&&!r.read_at);if(fresh)setToast(fresh)}seenNotices.current=new Set(incoming.map(r=>r.id));setRows(incoming);setUnread(count.count||0);setError('')}
 }else{const {data,error}=await supabase.rpc('get_buyer_saved_orders_v2');if(error)throw error;if(!cancelled){setRows((data||[]).slice(0,20));setError('')}}
 }catch{if(!cancelled)setError('Updates could not refresh. Check your connection.')}finally{pending=false}}
 refresh();const timer=setInterval(refresh,10000);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh)
 return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[session?.user?.id,role,panel])
 useEffect(()=>{if(!panel)return
 const close=event=>{if(!root.current?.contains(event.target))setPanel('')}
 const key=event=>{if(event.key==='Escape'){setPanel('');(panel==='menu'?menuButton:bellButton).current?.focus()}}
 document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);panelRef.current?.querySelector('button,a')?.focus()
 return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key)}
 },[panel])
 const merchant=role==='merchant'
 const links=merchant?[['dashboard','Overview','shop'],['orders','Orders','orders'],['products','Products','box'],['profile','Business profile','account'],['delivery-rates','Delivery areas & fees','location']]:[['/shop','Browse products','shop'],['/shop?tab=orders','My orders','orders'],['/shop?tab=cart','Cart','cart'],['/shop?location=1','Delivery location','location'],['/shop?tab=account','My account','account']]
 async function markRead(id){const {error}=await supabase.rpc('mark_notification_read',{p_id:id||null});if(error){setError('Could not mark this notification as read.');return false}setRows(current=>current.map(r=>!id||r.id===id?{...r,read_at:new Date().toISOString()}:r));setUnread(n=>id?Math.max(0,n-1):0);return true}
 return <div className="it-header-actions" ref={root}>
 <button ref={bellButton} type="button" className="it-icon-button" aria-label={`Notifications${unread?`, ${unread} unread`:''}`} aria-expanded={panel==='notifications'} aria-controls="it-notifications" onClick={()=>setPanel(panel==='notifications'?'':'notifications')}><Icon name="bell"/>{unread>0&&<small>{unread>99?'99+':unread}</small>}</button>
 <button ref={menuButton} type="button" className="it-icon-button" aria-label="Open menu" aria-expanded={panel==='menu'} aria-controls="it-menu" onClick={()=>setPanel(panel==='menu'?'':'menu')}><Icon name={panel==='menu'?'close':'menu'}/></button>
 <div className={panel==='menu'?'it-menu':'it-menu it-closed'} id="it-menu" ref={panel==='menu'?panelRef:null} aria-label="Account and shortcuts" inert={panel!=='menu'}><p className="it-menu-title">{merchant?'Your business':'Your shopping'}</p>
 {links.map(([destination,label,icon])=>merchant&&onNavigate?<button key={destination} type="button" onClick={()=>{setPanel('');onNavigate(destination)}}><Icon name={icon}/>{label}</button>:<a key={destination} href={merchant?`/?role=merchant&view=${destination}`:destination}><Icon name={icon}/>{label}</a>)}
 <a href="/protected-payment"><Icon name="shield"/>Protected payments</a>
 <Appearance/>
 <details><summary>Help & support</summary><p>For delivery or product questions, open your order and choose “Contact seller”. For protected orders, open Protected payments to report an issue.</p></details>
 <a href={merchant?'/shop':'/?role=merchant'}><Icon name={merchant?'shop':'account'}/>{merchant?'Shop as a buyer':'Set up / open my business'}</a>
 {session?<button type="button" disabled={busy} onClick={async()=>{setBusy(true);const {error}=await supabase.auth.signOut();setBusy(false);if(error)setError('Sign-out failed. Please retry.');else window.location.assign('/shop')}}><Icon name="logout"/>{busy?'Signing out…':'Sign out'}</button>:<a href={merchant?'/?role=merchant':'/buyer'}><Icon name="account"/>Sign in / Create account</a>}
 {error&&<p role="status">{error}</p>}</div>
 {panel==='notifications'&&<section id="it-notifications" className="it-menu it-notifications" ref={panelRef} aria-label="Notifications"><div className="it-menu-heading"><h2>Notifications</h2><button type="button" className="it-icon-button" aria-label="Close notifications" onClick={()=>{setPanel('');bellButton.current?.focus()}}><Icon name="close"/></button></div>{error&&<p role="status">{error}</p>}
 {!session?<p><a href="/buyer">Sign in</a> to see your order updates.</p>:<>{merchant&&unread>0&&<button type="button" onClick={()=>markRead(null)}>Mark all as read</button>}{rows.length?rows.map(r=>merchant?<a className={`it-notice-row ${r.read_at?'':'unread'}`} href={`/?role=merchant&orderId=${encodeURIComponent(r.order_id)}`} key={r.id} onClick={async event=>{event.preventDefault();if(!r.read_at)await markRead(r.id);window.location.assign(`/?role=merchant&orderId=${encodeURIComponent(r.order_id)}`)}}><b>{r.title}</b><span>{r.body}</span><time>{new Date(r.created_at).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})}</time></a>:<a className="it-notice-row" key={r.public_token} href={`/?track=${encodeURIComponent(r.public_token)}`}><b>{r.order_number} · {r.business_name}</b><span>{r.status}{r.payment_mode==='test'?' · Test order':''}</span></a>):<p>You’re all caught up. New order updates will appear here.</p>}</>}
 </section>}
 {toast&&<div className="it-live-notice" role="status"><b>{toast.title}</b><p>{toast.body}</p><a href={`/?role=merchant&orderId=${encodeURIComponent(toast.order_id)}`}>View order</a><button type="button" aria-label="Dismiss notification" onClick={()=>setToast(null)}><Icon name="close"/></button></div>}
 </div>
}

export function LocationPreference(){
 const [value,setValue]=useState({state:'',area:''}),[open,setOpen]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{setValue(readLocation());if(new URLSearchParams(window.location.search).get('location'))setOpen(true)},[])
 return <div className="it-location-preference"><button type="button" className="ux-secondary" onClick={()=>setOpen(!open)} aria-expanded={open}><Icon name="location"/>{value.state?[value.area,value.state].filter(Boolean).join(', '):'Set delivery location'}</button>{open&&<div className="it-location-fields"><p>Your area helps you choose delivery at checkout. Each store has its own delivery rates.</p><button type="button" className="ux-text" disabled={busy} onClick={async()=>{setBusy(true);setMessage('');try{setValue(await suggestCurrentLocation());setMessage('Check the suggested area before saving.')}catch(e){setMessage(e.message)}finally{setBusy(false)}}}>{busy?'Finding your area…':'Use my current location'}</button><small>With your permission, your coordinates are sent to BigDataCloud to suggest an area. You can enter it manually instead.</small><label>State<select value={value.state||''} onChange={e=>setValue({...value,state:e.target.value})}><option value="">Choose state</option>{states.map(s=><option key={s}>{s}</option>)}</select></label><label>Area / town<input value={value.area||''} maxLength={120} onChange={e=>setValue({...value,area:e.target.value})}/></label>{message&&<p role="status">{message}</p>}<button type="button" disabled={!value.state||!value.area?.trim()} onClick={()=>{saveLocation(value);setOpen(false)}}>Save location</button></div>}</div>
}

export function DeliveryFields({merchantId,value,onChange,onQuote}){
 const [zones,setZones]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0)
 const onQuoteRef=useRef(onQuote);onQuoteRef.current=onQuote
 useEffect(()=>{let active=true;setLoading(true);setError('');onQuoteRef.current(null)
 if(!merchantId||!supabase){setLoading(false);setError('The store could not load its delivery areas.');return}
 supabase.rpc('get_delivery_options',{p_merchant:merchantId}).then(({data,error})=>{if(!active)return;setLoading(false);if(error){setError('Delivery areas could not load. Please retry.');return}setZones(data||[])})
 return()=>{active=false}
 },[merchantId,retry])
 const zone=zones.find(z=>z.id===value.zoneId&&z.state===value.state&&z.area===value.area)
 useEffect(()=>{onQuoteRef.current(!loading&&zone&&value.address?.trim().length>=5?{zoneId:zone.id,fee:Number(zone.fee),state:zone.state,area:zone.area}:null)},[loading,zone?.id,zone?.fee,value.address])
 useEffect(()=>{if(!value.state){const saved=readLocation();if(saved.state)onChange({...value,state:saved.state,area:saved.area||'',zoneId:''})}},[merchantId])
 function updateState(state){onChange({...value,state,area:'',zoneId:''});onQuoteRef.current(null)}
 return <fieldset className="it-delivery"><legend>Where should we deliver?</legend><p>Choose your area to see this seller’s delivery fee.</p><button type="button" className="ux-text" disabled={busy} onClick={async()=>{setBusy(true);try{const location=await suggestCurrentLocation();onChange({...value,...location,zoneId:''});onQuoteRef.current(null);setError('Confirm your delivery area from the list and enter your street address.')}catch(e){setError(e.message)}finally{setBusy(false)}}}><Icon name="location"/>{busy?'Finding location…':'Use my current location'}</button><small>Optional: uses BigDataCloud with your device permission. Manual address entry is always available.</small>
 <div className="it-field-pair"><label>State<select required value={value.state||''} onChange={e=>updateState(e.target.value)}><option value="">Choose state</option>{states.map(s=><option key={s}>{s}</option>)}</select></label><label>Delivery area<select required value={zone?.id||''} disabled={loading||!value.state} onChange={e=>{const selected=zones.find(z=>z.id===e.target.value);onQuoteRef.current(null);onChange({...value,zoneId:selected?.id||'',area:selected?.area||''});if(selected)saveLocation(selected)}}><option value="">{loading?'Loading areas…':'Choose area'}</option>{zones.filter(z=>z.state===value.state).map(z=><option value={z.id} key={z.id}>{z.area} · {money.format(z.fee)}</option>)}</select></label></div>
 {!loading&&value.state&&!zones.some(z=>z.state===value.state)&&<p role="status">This seller has no delivery area available in {value.state}. Choose another state or contact the seller.</p>}
 {!loading&&!zones.length&&<p role="status">This seller has not added delivery rates yet. Contact them before checking out.</p>}
 <label>Street address & nearest landmark<input required autoComplete="street-address" maxLength={1000} value={value.address||''} onChange={e=>onChange({...value,address:e.target.value})} placeholder="House number, street and landmark"/></label>
 {zone&&<p className="it-delivery-price">Delivery to {zone.area}: <b>{money.format(zone.fee)}</b></p>}
 {error&&<p role="status">{error} <button type="button" className="ux-text" onClick={()=>setRetry(n=>n+1)}>Reload delivery areas</button></p>}
 </fieldset>
}

export function DeliveryRates({merchantId}){
 const [rows,setRows]=useState([]),[draft,setDraft]=useState({state:'Lagos',area:'',fee:''}),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false)
 async function load(){if(!supabase||!merchantId)return;const {data,error}=await supabase.from('delivery_zones').select('*').eq('merchant_id',merchantId).order('state').order('area');if(error)setNotice(error.message);else{setRows(data||[]);setReady(true)}}
 useEffect(()=>{load();const refresh=()=>{if(!document.hidden)load()};const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}},[merchantId])
 async function save(event){event.preventDefault();setBusy(true);setNotice('');try{const fee=Number(draft.fee);if(draft.fee===''||!Number.isFinite(fee)||fee<0)throw Error('Enter a valid delivery fee. Use 0 only for free delivery.');const existing=rows.find(r=>r.state===draft.state&&r.area.trim().toLowerCase()===draft.area.trim().toLowerCase());const payload={merchant_id:merchantId,state:draft.state,area:draft.area.trim(),fee,active:true,updated_at:new Date().toISOString()};const {error}=await(existing?supabase.from('delivery_zones').update(payload).eq('id',existing.id):supabase.from('delivery_zones').insert(payload));if(error)throw error;setDraft({...draft,area:'',fee:''});setNotice('Delivery rate saved. Buyers will see it at checkout.');await load()}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 return <section className="it-rates"><h1>Delivery areas & fees</h1><p>Add only the areas you deliver to. Buyers select their address before seeing a total. To charge the same fee across several areas, add each area at that rate.</p><form onSubmit={save}><div className="it-field-pair"><label>State<select value={draft.state} onChange={e=>setDraft({...draft,state:e.target.value})}>{states.map(s=><option key={s}>{s}</option>)}</select></label><label>Area / town<input required minLength={2} maxLength={120} value={draft.area} onChange={e=>setDraft({...draft,area:e.target.value})} placeholder="e.g. Ikeja"/></label></div><label>Delivery fee (₦)<input required min="0" step="0.01" type="number" value={draft.fee} onChange={e=>setDraft({...draft,fee:e.target.value})}/></label><button disabled={busy||!ready}>{busy?'Saving…':'Save area & fee'}</button></form>{notice&&<p className="notice" role="status">{notice}</p>}
 {!ready&&<button type="button" className="ux-secondary" onClick={load}>Reload delivery rates</button>}
 <div className="it-rate-list">{rows.map(r=><article key={r.id}><span><b>{r.area}, {r.state}</b><small>{money.format(r.fee)} · {r.active?'Available':'Paused'}</small></span><button type="button" className="ux-text" onClick={()=>{setDraft({state:r.state,area:r.area,fee:String(r.fee)});window.scrollTo(0,0)}}>Edit</button><button type="button" className="ux-text" disabled={busy} onClick={async()=>{setBusy(true);const {error}=await supabase.from('delivery_zones').update({active:!r.active,updated_at:new Date().toISOString()}).eq('id',r.id);if(error)setNotice(error.message);await load();setBusy(false)}}>{r.active?'Pause':'Enable'}</button></article>)}</div></section>
}

export function PaymentDeliveryStatus({order}){
 const payment=order.paymentStatus==='paid'?(order.paymentMode==='test'?'Test payment confirmed':'Payment received'):order.paymentStatus==='refunded'?'Refunded':order.paymentStatus==='failed'?'Payment unsuccessful':'Awaiting payment'
 const delivery=order.status==='Payment received'?'Preparing order':order.status==='Confirmed'?'Order confirmed':order.status
 return <div className="it-order-status"><span><small>Payment</small>{payment}</span><span><small>Order / delivery</small>{delivery}</span></div>
}
