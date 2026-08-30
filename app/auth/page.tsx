'use client'

import { useEffect,useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DemoAccessPanel } from '@/components/DemoAccessPanel'
import { DemoTourBubble } from '@/components/DemoTourBubble'
import { demoAccount,type DemoAccount } from '@/lib/demoAccounts'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode,setMode]=useState<'login'|'signup'>('login')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [nextPath,setNextPath]=useState('/dashboard')

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const requested=demoAccount(params.get('demo'))
    const requestedNext=params.get('next')
    if(requestedNext?.startsWith('/')&&!requestedNext.startsWith('//'))setNextPath(requestedNext)
    if(requested?.portal==='teacher'){
      setMode('login');setEmail(requested.email);setPassword(requested.password)
    }
  },[])

  function useDemo(account:DemoAccount){
    setMode('login');setEmail(account.email);setPassword(account.password);setError('')
    requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('input[name="email"]')?.focus())
  }

  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true);setError('')
    const fd=new FormData(e.currentTarget)
    const full_name=String(fd.get('name')||'')

    if(mode==='signup'){
      const res=await supabase.auth.signUp({email,password,options:{data:{full_name}}})
      setBusy(false)
      if(res.error)return setError(res.error.message)
      if(!res.data.session){
        setError('Account created. Check your email to confirm, then sign in.')
        setMode('login')
        return
      }
      router.replace('/dashboard');router.refresh();return
    }

    const res=await supabase.auth.signInWithPassword({email,password})
    if(res.error||!res.data.user){
      setBusy(false)
      return setError(res.error?.message||'Unable to sign in.')
    }

    await supabase.from('login_events').insert({user_id:res.data.user.id,client_note:'Teacher portal sign-in'})

    const profile=await supabase.from('profiles').select('role').eq('id',res.data.user.id).single()
    if(['principal','vice_principal','section_head','reviewer'].includes(String(profile.data?.role))){
      await supabase.auth.signOut();setBusy(false)
      setError('This sign-in is for teachers only. Leadership demo accounts use the CMS login.')
      return
    }

    setBusy(false);router.replace(nextPath);router.refresh()
  }

  return <>
    <main className="auth-wrap demo-auth-wrap">
      <section className="hero">
        <span className="eyebrow"><i className="dot"/>Teacher development command center</span>
        <h1>Every teacher.<br/><span>One place.</span></h1>
        <p>Track performance, attendance, lesson quality, professional development, observations, goals and recognition through one secure school platform.</p>
        <div className="auth-demo-hint"><b>Judging the project?</b><span>Use the demo accounts to test Teacher, Reviewer, Section Head, Vice Principal and Principal access.</span></div>
      </section>

      <div className="auth-stack">
        <section className="auth-card">
          <div className="traffic" aria-label="Window controls"><i/><i/><button type="button" className="traffic-secret-dot" aria-label="Open management login" onClick={()=>router.push('/cms/login')}/></div>
          <div className="panel-head">
            <div><small style={{color:'#758298'}}>TEACHER ACCESS</small><h2>{mode==='login'?'Teacher sign in':'Create teacher account'}</h2><p>Secure Supabase authentication</p></div>
            <span className="status good">Teacher</span>
          </div>

          <form onSubmit={submit}>
            {mode==='signup'&&<div className="field"><label>FULL NAME</label><input name="name" required/></div>}
            <div className="field"><label>EMAIL</label><input name="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
            <div className="field"><label>PASSWORD</label><input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/></div>
            {error&&<div className="error">{error}</div>}
            <div className="auth-actions">
              <button className="btn btn-primary" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in →':'Create account →'}</button>
              <button type="button" className="btn" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login'?'Sign up':'Back to login'}</button>
            </div>
          </form>
          <div className="command" style={{marginTop:22}}><div><small>Teacher portal</small><b>Learning & development workspace</b></div><i className="pulse"/></div>
        </section>

        <DemoAccessPanel portal="teacher" onUse={useDemo}/>
      </div>
    </main>
    <DemoTourBubble/>
  </>
}
