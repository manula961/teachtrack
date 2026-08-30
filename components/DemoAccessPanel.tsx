'use client'

import Link from 'next/link'
import { Copy,KeyRound,ShieldCheck,UserRound } from 'lucide-react'
import { DEMO_ACCOUNTS,type DemoAccount } from '@/lib/demoAccounts'

type Props={
  portal:'teacher'|'cms'
  onUse:(account:DemoAccount)=>void
}

export function DemoAccessPanel({portal,onUse}:Props){
  return <section className="demo-access-panel" aria-label="Demo accounts">
    <div className="demo-access-head">
      <div><small>COMPETITION DEMO</small><h3>Test every role</h3><p>All demo accounts use the same password. Use only with a demo Supabase project.</p></div>
      <span className="status good"><ShieldCheck size={13}/> 5 roles</span>
    </div>

    <div className="demo-password-bar">
      <KeyRound size={15}/><span>Password</span><code>TeachTrack#2026</code>
      <button type="button" onClick={()=>navigator.clipboard?.writeText('TeachTrack#2026')} aria-label="Copy demo password"><Copy size={13}/> Copy</button>
    </div>

    <div className="demo-account-list">
      {DEMO_ACCOUNTS.map(account=>{
        const samePortal=account.portal===portal
        const destination=account.portal==='cms'?'/cms/login':'/auth'
        return <article className="demo-account-row" key={account.role}>
          <span className="demo-role-icon"><UserRound size={15}/></span>
          <div className="demo-account-copy">
            <b>{account.label}</b>
            <code>{account.email}</code>
            <small>{account.note}</small>
          </div>
          {samePortal
            ? <button type="button" className="btn demo-use-btn" onClick={()=>onUse(account)}>Use demo</button>
            : <Link className="btn demo-use-btn" href={`${destination}?demo=${account.role}`}>Open {account.portal==='cms'?'CMS':'teacher'} login</Link>}
        </article>
      })}
    </div>
    <p className="demo-security-note"><b>Demo only:</b> these credentials are intentionally public for judging/testing. Do not create these privileged accounts in a production school database.</p>
  </section>
}
