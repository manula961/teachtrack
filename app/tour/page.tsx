'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft,ArrowRight,CheckCircle2,Sparkles,UserRound } from 'lucide-react'

const steps=[
 {title:'Principal Command Center',text:'Start with school-wide operations, development signals and attention items.',href:'/dashboard',role:'Principal',demo:'principal',portal:'cms'},
 {title:'Teacher Profiles',text:'Search staff by Teacher Code, subject, department or section and open the full professional record.',href:'/teachers',role:'Vice Principal',demo:'vice_principal',portal:'cms'},
 {title:'Teacher 360°',text:'Show one teacher’s evidence timeline across attendance, feedback, training, goals and milestones.',href:'/teacher-360',role:'Reviewer',demo:'reviewer',portal:'cms'},
 {title:'Growth Intelligence',text:'Explain the transparent weighted performance model and professional-development recommendations.',href:'/intelligence',role:'Section Head',demo:'section_head',portal:'cms'},
 {title:'Timetable Engine',text:'Demonstrate clash protection, ranked substitutes and automatic class timetable generation.',href:'/timetable-generator',role:'Vice Principal',demo:'vice_principal',portal:'cms'},
 {title:'Action Center',text:'Filter high-priority support, approvals and expiring evidence from one operational inbox.',href:'/action-center',role:'Principal',demo:'principal',portal:'cms'},
 {title:'Teacher Professional Hub',text:'Switch to the Teacher demo account to show self-service goals, timetable, documents and portfolio.',href:'/my-hub',role:'Teacher',demo:'teacher',portal:'teacher'},
 {title:'Achievement Wall',text:'Finish by celebrating professional growth and teaching excellence.',href:'/achievement-wall',role:'Teacher',demo:'teacher',portal:'teacher'},
]

export default function PublicTour(){
 const[i,setI]=useState(0)
 const s=steps[i]
 return <main id="main-content" className="public-tour-page">
  <header className="public-tour-header">
   <Link className="brand" href="/auth"><span className="brand-mark"/><span><strong>TeachTrack</strong><small>COMPETITION DEMO</small></span></Link>
   <div className="toolbar"><Link className="btn" href="/auth">Teacher login</Link><Link className="btn btn-primary" href="/cms/login">Leadership login</Link></div>
  </header>

  <section className="public-tour-hero">
   <div><span className="eyebrow"><i className="dot"/>Public demo tour</span><h1>See the complete teacher-development journey.</h1><p>This tour is public so judges can understand the workflow before signing in. Feature pages remain protected. Use the dedicated Demo Access page when you are ready to test a role.</p></div>
   <Sparkles size={54}/>
  </section>

  <section className="panel public-tour-focus">
   <div className="panel-head"><div><small>STEP {i+1} OF {steps.length}</small><h2>{s.title}</h2><p>{s.text}</p></div><span className="status good">{s.role}</span></div>
   <div className="progress" style={{margin:'24px 0'}}><span style={{width:`${((i+1)/steps.length)*100}%`}}/></div>
   <div className="public-tour-actions">
    <button className="btn" disabled={i===0} onClick={()=>setI(Math.max(0,i-1))}><ArrowLeft size={16}/> Previous</button>
    <div className="toolbar"><Link className="btn" href="/demo-access"><UserRound size={15}/> Demo access</Link><Link className="btn btn-primary" href={`${s.portal==='cms'?'/cms/login':'/auth'}?demo=${s.demo}&next=${encodeURIComponent(s.href)}`}>Sign in as {s.role} →</Link></div>
    <button className="btn" disabled={i===steps.length-1} onClick={()=>setI(Math.min(steps.length-1,i+1))}>Next <ArrowRight size={16}/></button>
   </div>
  </section>

  <section className="public-tour-steps">{steps.map((x,index)=><button key={x.title} className={`feature-card ${index===i?'active-tour-step':''}`} onClick={()=>setI(index)}><small>STEP {index+1}</small><h3>{x.title}</h3><p>{x.text}</p><span>{x.role}</span>{index===i&&<CheckCircle2 size={17}/>}</button>)}</section>
 </main>
}
