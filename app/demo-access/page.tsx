'use client'

import Link from 'next/link'
import { Copy, KeyRound, ShieldCheck, UserRound, ArrowLeft } from 'lucide-react'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demoAccounts'

export default function DemoAccessPage(){
  return <main className="public-tour-page demo-access-page">
    <header className="public-tour-header">
      <Link className="brand" href="/auth"><span className="brand-mark"/><span><strong>TeachTrack</strong><small>DEVELOPMENT CENTER</small></span></Link>
      <div className="toolbar"><Link className="btn" href="/auth"><ArrowLeft size={15}/> Teacher login</Link><Link className="btn" href="/cms/login">Leadership login</Link><Link className="btn btn-primary" href="/tour">Demo tour</Link></div>
    </header>

    <section className="public-tour-hero">
      <div><span className="eyebrow"><i className="dot"/>Competition testing</span><h1>Demo access</h1><p>Choose a role to test TeachTrack. Demo credentials are intentionally public for competition judging and must only be used with the demo database.</p></div>
      <ShieldCheck size={54}/>
    </section>

    <section className="panel demo-access-panel" aria-label="Demo accounts">
      <div className="demo-access-head">
        <div><small>DEMO CREDENTIALS</small><h2>Five roles, one password</h2><p>Each button opens the correct portal and prefills that role's demo credentials.</p></div>
        <span className="status good"><ShieldCheck size={13}/> 5 roles</span>
      </div>
      <div className="demo-password-bar">
        <KeyRound size={15}/><span>Password</span><code>{DEMO_PASSWORD}</code>
        <button type="button" onClick={()=>navigator.clipboard?.writeText(DEMO_PASSWORD)} aria-label="Copy demo password"><Copy size={13}/> Copy</button>
      </div>
      <div className="demo-account-list">
        {DEMO_ACCOUNTS.map(account=>{
          const destination=account.portal==='cms'?'/cms/login':'/auth'
          return <article className="demo-account-row" key={account.role}>
            <span className="demo-role-icon"><UserRound size={15}/></span>
            <div className="demo-account-copy"><b>{account.label}</b><code>{account.email}</code><small>{account.note}</small></div>
            <Link className="btn demo-use-btn" href={`${destination}?demo=${account.role}`}>Use {account.label} →</Link>
          </article>
        })}
      </div>
      <p className="demo-security-note"><b>Demo only:</b> do not create or publish these privileged credentials in a real production school database.</p>
    </section>
  </main>
}
