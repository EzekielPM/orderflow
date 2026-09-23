'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'
import {readCart} from '../../lib/buyer-context'

export default function BuyerAccount(){
 const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[store,setStore]=useState(''),[business,setBusiness]=useState('your vendor'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[session,setSession]=useState(null),[dark,setDark]=useState(false),[count,setCount]=useState(0),[ready,setReady]=useState(false),[showPassword,setShowPassword]=useState(false)
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  if(params.get('save')){sessionStorage.setItem('orderflow-save-order',params.get('save'));params.delete('save');window.history.replaceState({},'',window.location.pathname+'?'+params.toString()+window.location.hash)}
  const theme=localStorage.getItem('orderflow-theme')==='dark';setDark(theme);document.documentElement.dataset.theme=theme?'dark':'light'
  const id=params.get('store')||localStorage.getItem('orderflow-buyer-store')||''
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
   const destination=store||session.user.user_metadata?.last_store_id
   if(destination&&!cancelled)window.location.replace(`/?store=${encodeURIComponent(destination)}`)
  }
  finish().catch(()=>{if(!cancelled)setNotice('Could not return to the store. Use Continue shopping below.')})
  return ()=>{cancelled=true}
 },[ready,session,store,mode])
 const storeUrl=store?`/?store=${encodeURIComponent(store)}`:'/'
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
 return <main className="buyer-auth"><header><a className="buyer-back" href={storeUrl} aria-label="Back to catalogue">‹</a><div className="orderflow-logo compact"><span className="logo-symbol"><i/><i/><i/></span><strong>Order<span>Flow</span></strong></div><button className="theme-toggle" onClick={()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';localStorage.setItem('orderflow-theme',next?'dark':'light')}} aria-label="Switch theme">{dark?'☀':'◐'}</button></header><section><h1>{mode==='signup'?'Create your account':mode==='reset'?'Forgot your password?':mode==='update'?'Set a new password':'Welcome back'}</h1><p>{mode==='reset'?'We’ll email you a password-reset link.':`Continue shopping at ${business}.`}</p>{notice&&<p role="status" className="notice">{notice}</p>}
 {session&&mode!=='update'?<div><p>Signed in as {session.user.email}.</p><a href={storeUrl}>Continue shopping →</a><button className="small-action" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error)setNotice(error.message);else setSession(null)}}>Sign out</button></div>:<form onSubmit={submit}>{mode==='signup'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label>}{mode!=='update'&&<label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=='reset'&&<><label>Password<input type={showPassword?'text':'password'} minLength={8} required autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="small-action" type="button" aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'} password</button></>}{mode==='signin'&&<button className="small-action forgot-link" type="button" onClick={()=>{setMode('reset');setNotice('')}}>Forgot password?</button>}<button disabled={busy||!supabase||!ready}>{busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':mode==='update'?'Save password':'Sign in'}</button><button type="button" className="link" disabled={busy} onClick={()=>{setMode(mode==='signin'?'signup':'signin');setNotice('')}}>{mode==='signin'?'New here? Create account':'Back to sign in'}</button></form>}
 {!session&&store&&<a className="guest-link" href={storeUrl}>Continue as guest</a>}<div className="buyer-cart-reminder"><strong>{count?'Your cart is waiting':'Good finds, at your pace'}</strong><p>{count?`${count} item${count===1?'':'s'} saved on this device.`:'Browse the catalogue and shop when you’re ready.'}</p></div></section></main>
}
