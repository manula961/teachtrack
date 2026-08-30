'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, Zap } from 'lucide-react'
import { useData } from '@/components/DataProvider'

const actions=[
 ['Teacher 360°','/teacher-360','360 profile timeline'],
 ['Compare teachers','/compare','comparison performance'],
 ['Development pathway','/pathway','growth recommendation'],
 ['Department dashboard','/department-insights','grade department HOS'],
 ['Excellence board','/leaderboard','awards gamification recognition'],
 ['Printable portfolio','/portfolio','report print PDF'],
 ['Timetable generator','/timetable-generator','automatic schedule'],
 ['Conflict detection','/conflicts','clashes'],
 ['Approval workflows','/approvals','pending approvals'],
 ['Demo tour','/tour','competition presentation'],
]

export default function SearchPage(){
 const {data,loading,role}=useData();const[q,setQ]=useState('')
 const results=useMemo(()=>{
  const query=q.trim().toLowerCase();if(!query)return []
  const collections:any[]=[
   ['Teachers','/teacher-360',data.teachers_dashboard||[],['teacher_code','id','name','subject','department','section','email']],
   ['Classes','/classes',data.timetable_classes||[],['name','grade','section','medium','academic_year']],
   ['Lessons','/lessons',data.lessons||[],['title','subject','grade','status']],
   ['Training','/training',data.training||[],['title','provider','status']],
   ['Achievements','/achievements',data.achievements||[],['title','badge_name','description']],
   ['Calendar','/calendar',data.school_events||[],['title','event_type','location']],
   ['Documents','/documents',data.teacher_documents||[],['title','document_type']],
   ['Departments','/department-insights',data.departments||[],['name','description']],
  ]
  const records=collections.flatMap(([type,href,rows,keys])=>rows.filter((r:any)=>keys.some((k:string)=>String(r[k]??'').toLowerCase().includes(query))).map((r:any)=>({
    type,href:type==='Teachers'?`${href}?teacher=${r.id}`:type==='Departments'?`${href}?department=${r.id}`:href,
    label:r.name||r.title||r.badge_name||r.document_type||'Record',
    sub:keys.map((k:string)=>r[k]).filter(Boolean).slice(0,3).join(' · ')
  })))
  const quick=actions.filter(x=>(role!=='teacher'||!['/compare','/department-insights'].includes(x[1]))&&x.join(' ').toLowerCase().includes(query)).map(x=>({type:'Quick action',href:x[1],label:x[0],sub:x[2]}))
  return [...quick,...records].slice(0,80)
 },[q,data])
 if(loading)return <div className="loading">Indexing school records…</div>
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Smart search & quick actions</span><h1 style={{marginTop:14}}>Find anything</h1><p>Search teacher code, numeric ID, teacher name, class, department, feature or workflow.</p></div></div>
  <section className="panel"><div className="palette-input" style={{border:'1px solid var(--line)',borderRadius:12}}><Search size={18}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Try TCH-0012, Grade 10 A, attendance, portfolio…"/></div>
  {!q&&<div className="cards" style={{marginTop:18}}>{actions.filter(x=>role!=='teacher'||!['/compare','/department-insights'].includes(x[1])).slice(0,6).map(x=><Link className="feature-card" href={x[1]} key={x[0]}><Zap size={18}/><h3>{x[0]}</h3><p>{x[2]}</p></Link>)}</div>}
  <div className="cms-queue" style={{marginTop:16}}>{results.map((r:any,i)=><Link className="queue-row" href={r.href} key={`${r.type}-${r.label}-${i}`}><div><b>{r.label}</b><small>{r.type} · {r.sub||'Open'}</small></div><span>→</span></Link>)}</div>{q&&!results.length&&<div className="empty">No matching records or quick actions.</div>}</section>
 </>
}
