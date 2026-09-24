'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'
import {readCart} from '../../lib/buyer-context'
import '../shop/shop.css'
function GoogleIcon() {
  return <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.04v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.38 13.92A6 6 0 0 1 6.07 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.34-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.34 2.61C7.17 7.71 9.39 5.95 12 5.95Z"/></svg>
}

export default function BuyerAccount(){
 const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[store,setStore]=useState(''),[business,setBusiness]=useState('your vendor'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[session,setSession]=useState(null),[dark,setDark]=useState(false),[count,setCount]=useState(0),[ready,setReady]=useState(false),[showPassword,setShowPassword]=useState(false)
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  if(params.get('save')){sessionStorage.setItem('orderflow-save-order',params.get('save'));params.delete('save');window.history.replaceState({},'',window.location.pathname+'?'+params.toString()+window.location.hash)}
  const theme=localStorage.getItem('orderflow-theme')==='dark';setDark(theme);document.documentElement.dataset.theme=theme?'dark':'light'
  const id=params.get('store')||''
  setStore(id);setBusiness(localStorage.getItem(`orderflow-store-name:${id}`)||'your vendor');setCount(readCart(id).reduce((n,r)=>n+r.quantity,0))
  setMode(['signup','update'].includes(params.get('mode'))?params.get('mode'):'signin');setReady(true)
  if(id)localStorage.setItem('orderflow-buyer-store',id)
  if(!supabase){setNotice('Sign-in is not configured.');return}
  supabase.auth.getSession().then(({data,error})=>{if(error)setNotice(error.message);else setSession(data.session)})
  const {data}=supabase.auth.onAuthStateChange((event,next)=>{if(event==='PASSWORD_RECOVERY')setMode('update');setSession(next)})
  return ()=>data.subscription.unsubscribe()
 },[])
 useEffect(()=>{
  if(!ready||!session||mode==='update')return
  let cancelled=false
  async function finish(){
   const token=sessionStorage.getItem('orderflow-save-order')
   if(token){const {error}=await supabase.rpc('save_buyer_order',{p_token:token});if(cancelled)return;if(error){setNotice('Signed in, but this order could not be saved. Keep your tracking link and try again.');return}sessionStorage.removeItem('orderflow-save-order')}
   const destination=store
   if(!cancelled)window.location.replace(destination?`/?store=${encodeURIComponent(destination)}`:'/shop')
  }
  finish().catch(()=>{if(!cancelled)setNotice('Could not return to the store. Use Continue shopping below.')})
  return ()=>{cancelled=true}
 },[ready,session,store,mode])
 const storeUrl=store?`/?store=${encodeURIComponent(store)}`:'/shop'
 async function googleSignIn(){
  if(!supabase)return
  setBusy(true);setNotice('')
  const callback=new URL('/buyer',window.location.origin)
  if(store)callback.searchParams.set('store',store)
  const pending=sessionStorage.getItem('orderflow-save-order');if(pending)callback.searchParams.set('save',pending)
  const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.toString()}})
  if(error){setNotice(error.message);setBusy(false)}
 }
 async function submit(event){
  event.preventDefault();if(!supabase)return
  setBusy(true);setNotice('')
  try{
   const pending=sessionStorage.getItem('orderflow-save-order')
   const callback=window.location.origin+`/buyer?store=${encodeURIComponent(store)}`+(pending?`&save=${encodeURIComponent(pending)}`:'')
   if(mode==='reset'){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:callback+'&mode=update'});if(error)throw error;setNotice('If an account exists for this email, a reset link will arrive shortly.');return}
   if(mode==='update'){if(!session)throw Error('Open the password-reset link from your email first.');const {error}=await supabase.auth.updateUser({password});if(error)throw error;setMode('signin');return}
   const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:callback,data:{full_name:name,account_type:'buyer',last_store_id:store}}}):await supabase.auth.signInWithPassword({email,password})
   if(result.error)throw result.error
   if(!result.data.session)setNotice('Check your email to confirm your account, then return here to sign in.')
   else setSession(result.data.session)
  }catch(error){setNotice(error.message)}finally{setBusy(false)}
 }
 return <main className="buyer-auth"><header><a className="buyer-back" href={storeUrl} aria-label="Back to catalogue">‹</a><div className="orderflow-logo compact"><span className="logo-symbol"><i/><i/><i/></span><strong>Order<span>Flow</span></strong></div><button className="theme-toggle" onClick={()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';localStorage.setItem('orderflow-theme',next?'dark':'light')}} aria-label="Switch theme">{dark?'☀':'◐'}</button></header><section><h1>{mode==='signup'?'Create your account':mode==='reset'?'Forgot your password?':mode==='update'?'Set a new password':'Welcome back'}</h1><p>{mode==='reset'?'We’ll email you a password-reset link.':store?`Continue shopping at ${business}.`:'Discover vendors and shop their catalogues.'}</p>{notice&&<p role="status" className="notice">{notice}</p>}
 {session&&mode!=='update'?<div><p>Signed in as {session.user.email}.</p><a href={storeUrl}>Continue shopping →</a><button className="small-action" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error)setNotice(error.message);else setSession(null)}}>Sign out</button></div>:<form onSubmit={submit}>{["signin","signup"].includes(mode)&&<><button type="button" className="social google-button" disabled={busy||!supabase} onClick={googleSignIn}><GoogleIcon/>Continue with Google</button><div className="or">or continue with email</div></>}{mode==='signup'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label>}{mode!=='update'&&<label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=='reset'&&<><label>Password<input type={showPassword?'text':'password'} minLength={8} required autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="small-action" type="button" aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'} password</button></>}{mode==='signin'&&<button className="small-action forgot-link" type="button" onClick={()=>{setMode('reset');setNotice('')}}>Forgot password?</button>}<button disabled={busy||!supabase||!ready}>{busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':mode==='update'?'Save password':'Sign in'}</button><button type="button" className="link" disabled={busy} onClick={()=>{setMode(mode==='signin'?'signup':'signin');setNotice('')}}>{mode==='signin'?'New here? Create account':'Back to sign in'}</button></form>}
 {!session&&<a className="guest-link" href={storeUrl}>{store?'Continue as guest':'Browse stores'}</a>}<div className="buyer-cart-reminder"><strong>{count?'Your cart is waiting':'Good finds, at your pace'}</strong><p>{count?`${count} item${count===1?'':'s'} saved on this device.`:'Browse the catalogue and shop when you’re ready.'}</p></div></section></main>
}
