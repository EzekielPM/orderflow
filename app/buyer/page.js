'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function BuyerAccount(){
 const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[store,setStore]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[user,setUser]=useState(null),[dark,setDark]=useState(false)
 useEffect(()=>{
   const theme=localStorage.getItem('orderflow-theme')==='dark';setDark(theme);document.documentElement.dataset.theme=theme?'dark':'light'
   const id=new URLSearchParams(window.location.search).get('store')||localStorage.getItem('orderflow-buyer-store')||''
   setStore(id)
   if(id)localStorage.setItem('orderflow-buyer-store',id)
   if(!supabase){setNotice('Sign-in is not configured.');return}
   function returnToStore(session){
     if(!session)return
     setUser(session.user)
     const destination=id||session.user.user_metadata?.last_store_id
     if(destination)window.location.replace(`/?store=${encodeURIComponent(destination)}`)
   }
   supabase.auth.getSession().then(({data})=>returnToStore(data.session))
   const {data}=supabase.auth.onAuthStateChange((_event,session)=>returnToStore(session))
   return ()=>data.subscription.unsubscribe()
 },[])
 async function submit(event){
   event.preventDefault();if(!supabase)return
   setBusy(true);setNotice('')
   try{
     const callback=window.location.origin+'/buyer'+(store?`?store=${encodeURIComponent(store)}`:'')
     const result=mode==='signup'
       ?await supabase.auth.signUp({email,password,options:{emailRedirectTo:callback,data:{full_name:name,account_type:'buyer',last_store_id:store}}})
       :await supabase.auth.signInWithPassword({email,password})
     if(result.error)throw result.error
     if(!result.data.session)setNotice('Check your email to confirm your account, then return here to sign in.')
     else if(store)window.location.replace(`/?store=${encodeURIComponent(store)}`)
     else setUser(result.data.user)
   }catch(error){setNotice(error.message)}finally{setBusy(false)}
 }
 return <main style={{maxWidth:520,margin:'40px auto',padding:24,width:'100%'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><a href={store?`/?store=${encodeURIComponent(store)}`:'/'}>‹ Back</a><button className="theme-toggle" onClick={()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';localStorage.setItem('orderflow-theme',next?'dark':'light')}} aria-label="Switch theme">{dark?'☀':'◐'}</button></div><h1>{user?'Choose a store':mode==='signup'?'Create your buyer account':'Welcome back'}</h1><p>Shop from your vendor’s catalogue.</p>{notice&&<p role="status" className="notice">{notice}</p>}
 {user?<section className="form"><p>Signed in as {user.email}. Open your vendor’s storefront link to browse their products.</p><button className="secondary" onClick={async()=>{await supabase.auth.signOut();setUser(null)}}>Sign out</button></section>:<form className="form" onSubmit={submit}>{mode==='signup'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label>}<label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" minLength={8} required autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||!supabase}>{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>{setMode(mode==='signup'?'signin':'signup');setNotice('')}}>{mode==='signup'?'Already have an account? Sign in':'New here? Create account'}</button></form>}
 </main>
}
