'use client'
import Link from 'next/link'
import { HelpCircle, Keyboard, Search, ShieldCheck } from 'lucide-react'
export default function Help(){
 const topics=[
  ['Teacher development','Use Teacher 360°, Growth Intelligence and Development Pathway to move from evidence to an actionable goal.','/teacher-360'],
  ['Timetable & substitutions','Use Timetable for daily schedules and the Generator for class timetable creation with clash protection.','/timetable'],
  ['Reports & portfolios','Generate teacher evidence reports and print/save the professional portfolio as PDF.','/portfolio'],
  ['Approvals','Review leave, lessons and professional-development workflow items in one place.','/approvals'],
 ]
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Contextual help</span><h1 style={{marginTop:14}}>Help Center</h1><p>Short guidance for common TeachTrack workflows and keyboard shortcuts.</p></div><Link className="btn btn-primary" href="/tour">Start guided tour →</Link></div>
 <div className="grid-2"><section className="panel"><div className="panel-head"><div><h3>Quick help</h3><p>Open the feature you need</p></div><HelpCircle size={23}/></div>{topics.map(([title,text,href])=><Link className="queue-row" href={href} key={title}><div><b>{title}</b><small>{text}</small></div><span>→</span></Link>)}</section>
 <section className="panel"><div className="panel-head"><div><h3>Keyboard shortcuts</h3><p>Move faster without leaving the keyboard</p></div><Keyboard size={23}/></div>{[['Ctrl/Cmd + K','Global command search'],['/','Open search'],['N','Quick Add'],['Esc','Close menus and dialogs']].map(([key,label])=><div className="metric" key={key}><span>{label}</span><kbd>{key}</kbd></div>)}</section></div>
 <div className="grid-2" style={{marginTop:18}}><section className="panel"><div className="panel-head"><div><h3>Metric transparency</h3><p>Know why a score or recommendation appears.</p></div><Search size={22}/></div><p>Growth Intelligence displays every component, weight and recommendation source. It uses explainable rule-based analytics rather than a hidden model.</p><Link className="btn" href="/intelligence">Why this score? →</Link></section><section className="panel"><div className="panel-head"><div><h3>Privacy & roles</h3><p>Access follows school responsibilities.</p></div><ShieldCheck size={22}/></div><p>Teacher views are scoped to their linked profile where appropriate. Leadership and reviewer access is governed by role checks and Supabase RLS.</p><Link className="btn" href="/security">Security details →</Link></section></div></>
}
