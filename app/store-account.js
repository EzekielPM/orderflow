'use client'
import {useState} from 'react'
import {supabase} from '../lib/supabase'
import {buyerLink} from '../lib/buyer-context'

export default function StoreAccount({session,store,business,cart,onCart,onSignOut}) {
 const [open,setOpen]=useState(false),[orders,setOrders]=useState([]),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
 async function showAccount(){
  setOpen(true);setBusy(true);setNotice('')
  try {const {data,error}=await supabase.rpc('get_buyer_saved_orders');if(error)throw error;setOrders(data||[])}
  catch {setNotice('Your saved orders could not load. Please try again.')}finally{setBusy(false)}
 }
 return <><div className="store-account-bar"><button className="account-entry" onClick={()=>session?showAccount():window.location.assign(buyerLink(store,business,cart))}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg>{session?'My account':'Sign in / Create account'}</button><button className="account-cart" onClick={onCart} aria-label={`Open cart, ${cart.reduce((n,r)=>n+r.quantity,0)} items`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"/></svg><span>{cart.reduce((n,r)=>n+r.quantity,0)}</span></button></div>
 {open&&<section className="buyer-account-panel" aria-label="My account"><div className="section-title"><h2>My account</h2><button className="small-action" onClick={()=>setOpen(false)}>Close</button></div><p>{session?.user?.email}</p><h3>My orders</h3><small>Orders saved to your account across stores.</small>{busy?<p role="status">Loading orders…</p>:notice?<p role="alert">{notice} <button className="small-action" onClick={showAccount}>Retry</button></p>:orders.length?orders.map(order=><a className="saved-buyer-order" key={order.public_token} href={`/?track=${encodeURIComponent(order.public_token)}`}><span><strong>{order.order_number}</strong><small>{order.business_name} · {new Date(order.created_at).toLocaleDateString()}</small></span><span>{order.status}<small>Track order →</small></span></a>):<p>Your orders will appear here after you place an order while signed in, or save an order from its payment-success screen.</p>}<button className="small-action" onClick={async()=>{await onSignOut();setOpen(false);setOrders([])}}>Sign out</button></section>}</>
}
