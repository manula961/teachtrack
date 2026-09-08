'use client'

import { useEffect,useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { DemoTourBubble } from '@/components/DemoTourBubble'
import { demoAccount } from '@/lib/demoAccounts'

export default function CmsLoginPage() {
  const router=useRouter()
  const supabase=createClient()
  const[busy,setBusy]=useState(false)
  const[error,setError]=useState('')
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[nextPath,setNextPath]=useState('/cms')

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const requested=demoAccount(params.get('demo'))
    const requestedNext=params.get('next')
    if(requestedNext?.startsWith('/')&&!requestedNext.startsWith('//'))setNextPath(requestedNext)
    if(requested?.portal==='cms'){setEmail(requested.email);setPassword(requested.password)}
  },[])

  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError('')

    const auth=await supabase.auth.signInWithPassword({email,password})
    if(auth.error||!auth.data.user){
      setBusy(false);setError(auth.error?.message||'Unable to sign in.');return
    }

    await supabase.from('login_events').insert({user_id:auth.data.user.id,client_note:'CMS sign-in'})
    const profile=await supabase.from('profiles').select('role, full_name').eq('id',auth.data.user.id).single()

    if(profile.error||!['principal','vice_principal','section_head','reviewer'].includes(String(profile.data?.role))){
      await supabase.auth.signOut();setBusy(false)
      setError('CMS access is restricted to authorized staff accounts. Teacher demo access is on the teacher login.')
      return
    }

    router.replace(nextPath);router.refresh()
  }

  return <>
    <main id="main-content" className="auth-wrap cms-auth demo-auth-wrap">
      <section className="hero">
        <span className="eyebrow"><i className="dot"/>Restricted management system</span>
        <h1>School control.<br/><span>Behind the scenes.</span></h1>
        <p>Private school-management access for Principal, Vice Principal, Section Head and Reviewer roles.</p>
        <div className="auth-demo-hint"><b>Competition demo</b><span>Demo leadership credentials are kept on a separate testing page.</span><Link className="btn" href="/demo-access">Open demo access →</Link></div>
      </section>

      <div className="auth-stack">
        <section className="auth-card">
          <div className="traffic"><i/><i/><i/></div>
          <div className="panel-head">
            <div><small style={{color:'#758298'}}>PRIVATE CMS</small><h2>Management sign in</h2><p>Leadership credentials required</p></div>
            <span className="status">Restricted</span>
          </div>

          <form onSubmit={submit}>
            <div className="field"><label htmlFor="cms-email">LEADERSHIP EMAIL</label><input id="cms-email" name="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
            <div className="field"><label htmlFor="cms-password">PASSWORD</label><input id="cms-password" name="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/></div>
            {error&&<div className="error">{error}</div>}
            <button className="btn btn-primary cms-login-btn" disabled={busy}>{busy?'Verifying access…':'Enter CMS →'}</button>
          </form>

          <div className="command" style={{marginTop:22}}><div><small>Access policy</small><b>Leadership role + Supabase RLS</b></div><i className="pulse"/></div>
        </section>

      </div>
    </main>
    <DemoTourBubble/>
  </>
}
