'use client'
import Link from 'next/link'
import { useEffect,useMemo,useState } from 'react'
import { AlertTriangle,CheckCircle2,Clock3,Search } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { derivedAlerts } from '@/lib/teacherInsights'
import { supportIndicators } from '@/lib/advancedUx'

type QueueItem={priority:string;title:string;detail:string;kind:string;href:string}

export default function ActionCenter(){
 const{data,loading,role}=useData()
 const[tab,setTab]=useState('All'),[query,setQuery]=useState(''),[limit,setLimit]=useState(20)
 const leadership=['principal','vice_principal','section_head','reviewer'].includes(role)

 const alerts=derivedAlerts(data)
 const support=leadership?supportIndicators(data):[]
 const approvals=(data.approval_requests||[]).filter((x:any)=>String(x.status).toLowerCase()==='pending')
 const now=new Date();now.setHours(0,0,0,0)
 const in60=new Date(now.getTime()+60*86400000)
 const expiring=(data.teacher_documents||[]).filter((x:any)=>{
  if(!x.expiry_date)return false
  const d=new Date(`${x.expiry_date}T00:00:00`)
  return d>=now&&d<=in60
 })

 const rows=useMemo(()=>{
  const raw:QueueItem[]=[
   ...alerts.map((x:any)=>({
    priority:x.priority||'Medium',
    title:x.title,
    detail:x.detail,
    kind:x.kind||'Alert',
    href:x.kind==='Goal'?'/goals':x.kind==='Observation'?'/observation-followup':x.kind==='Leave'?'/leave':'/notifications'
   })),
   ...approvals.map((x:any)=>({
    priority:'Medium',title:x.title||'Pending approval',detail:x.request_type||'Approval workflow',kind:'Approval',href:'/approvals'
   })),
   ...support.map((x:any)=>({
    priority:'High',title:`Support: ${x.teacher.name}`,detail:x.reasons.join(' · '),kind:'Support',href:`/teacher-360?teacher=${x.teacher.id}`
   })),
   ...expiring.map((x:any)=>({
    priority:'Medium',title:x.title||'Document expiring',detail:`Expires ${x.expiry_date}`,kind:'Expiring',href:'/certificate-calendar'
   }))
  ]
  const seen=new Set<string>()
  return raw.filter(x=>{
   const key=`${x.kind}|${x.title}|${x.detail}`.toLowerCase()
   if(seen.has(key))return false
   seen.add(key);return true
  }).sort((a,b)=>{
   const rank=(p:string)=>p==='High'?0:p==='Medium'?1:2
   return rank(a.priority)-rank(b.priority)||a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title)
  })
 },[alerts,approvals,support,expiring])

 const tabs=useMemo(()=>[
  ['All',rows.length],
  ['High',rows.filter(x=>x.priority==='High').length],
  ['Approvals',rows.filter(x=>x.kind==='Approval').length],
  ['Support',rows.filter(x=>x.kind==='Support').length],
  ['Expiring',rows.filter(x=>x.kind==='Expiring').length],
 ] as const,[rows])

 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase()
  return rows.filter(x=>{
   const tabMatch=tab==='All'||(tab==='High'&&x.priority==='High')||(tab==='Approvals'&&x.kind==='Approval')||(tab==='Support'&&x.kind==='Support')||(tab==='Expiring'&&x.kind==='Expiring')
   const queryMatch=!q||`${x.title} ${x.detail} ${x.kind} ${x.priority}`.toLowerCase().includes(q)
   return tabMatch&&queryMatch
  })
 },[rows,tab,query])

 useEffect(()=>setLimit(20),[tab,query])

 if(loading)return <div className="loading">Building action center…</div>

 const visible=filtered.slice(0,limit)
 return <>
  <div className="page-head">
   <div><span className="eyebrow"><i className="dot"/>Unified inbox</span><h1 style={{marginTop:14}}>Action Center</h1><p>Approvals, deadlines, follow-ups, support indicators and expiring evidence—sorted by urgency.</p></div>
   <span className="status">{rows.length} open</span>
  </div>

  <div className="kpis">
   <div className="kpi"><small>HIGH PRIORITY</small><b>{rows.filter(x=>x.priority==='High').length}</b><span>Needs attention</span></div>
   <div className="kpi"><small>APPROVALS</small><b>{approvals.length}</b><span>Pending workflow</span></div>
   <div className="kpi"><small>SUPPORT</small><b>{support.length}</b><span>Explainable indicators</span></div>
   <div className="kpi"><small>EXPIRING</small><b>{expiring.length}</b><span>Within 60 days</span></div>
  </div>

  <section className="panel action-center-panel" style={{marginTop:18}}>
   <div className="action-center-toolbar">
    <div className="action-tabs" role="tablist" aria-label="Action Center filters">
     {tabs.map(([label,count])=><button key={label} role="tab" aria-selected={tab===label} className={tab===label?'active':''} onClick={()=>setTab(label)}>{label}<span>{count}</span></button>)}
    </div>
    <label className="action-search"><Search size={15}/><span className="sr-only">Search actions</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search actions…"/></label>
   </div>

   <div className="action-summary"><span>Showing <b>{visible.length}</b> of <b>{filtered.length}</b></span>{(tab!=='All'||query)&&<button onClick={()=>{setTab('All');setQuery('')}}>Clear filters</button>}</div>

   <div className="action-list">
    {visible.map((x,i)=><Link className="queue-row action-row" href={x.href} key={`${x.kind}-${x.title}-${i}`}>
     <div className="action-row-copy"><b>{x.priority==='High'?<AlertTriangle size={14}/>:<Clock3 size={14}/>}<span>{x.title}</span></b><small>{x.kind} · {x.detail}</small></div>
     <span className={x.priority==='High'?'priority-high':'priority-normal'}>{x.priority||'Normal'}</span>
    </Link>)}
   </div>

   {!filtered.length&&<div className="empty"><CheckCircle2 size={20}/> No action items match this view.</div>}
   {visible.length<filtered.length&&<div className="load-more"><button className="btn" onClick={()=>setLimit(x=>x+20)}>Load 20 more</button></div>}
  </section>
 </>
}
