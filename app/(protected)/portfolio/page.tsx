'use client'
import { useState } from 'react'
import { Printer } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { composite, performanceTrend, teacherRows } from '@/lib/teacherInsights'

export default function Portfolio(){
 const {data,loading,profile,role}=useData();const teachers=data.teachers_dashboard||[];const leadership=['principal','vice_principal','section_head','reviewer'].includes(role)
 const [id,setId]=useState(leadership?String(teachers[0]?.id||''):String(profile?.teacher_id||teachers[0]?.id||''));const t=teachers.find((x:any)=>String(x.id)===id)||teachers.find((x:any)=>String(x.id)===String(profile?.teacher_id))||teachers[0]
 if(loading)return <div className="loading">Preparing portfolio…</div>
 if(!t)return <div className="panel empty">No teacher records.</div>
 const c=composite(data,t),own=teacherRows(data,t.id),trend=performanceTrend(data,t)
 return <div className="portfolio-print">
  <div className="page-head no-print"><div><span className="eyebrow"><i className="dot"/>Teacher portfolio</span><h1 style={{marginTop:14}}>Printable professional report</h1><p>A competition-ready evidence summary for appraisal, recognition and development conversations.</p></div><div className="toolbar">{leadership&&<select className="search" value={String(t.id)} onChange={e=>setId(e.target.value)}>{teachers.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select>}<button className="btn btn-primary" onClick={()=>window.print()}><Printer size={16}/> Print / Save PDF</button></div></div>
  <div className="print-only"><h1>TeachTrack Professional Portfolio</h1><p>Teacher Performance & Development Tracking System</p></div>
  <section className="panel"><div className="panel-head"><div><small>{t.teacher_code||`ID ${t.id}`}</small><h2>{t.name}</h2><p>{t.subject} · {t.department} · {t.section||'—'}</p></div><div className="hero-score">{c.score}</div></div><div className="kpis"><div className="kpi"><small>TREND</small><b style={{fontSize:28}}>{trend.symbol} {trend.direction}</b><span>Recent evidence</span></div><div className="kpi"><small>TRAINING</small><b>{own.training.length}</b><span>records</span></div><div className="kpi"><small>GOALS</small><b>{own.goals.length}</b><span>development targets</span></div><div className="kpi"><small>ACHIEVEMENTS</small><b>{own.achievements.length}</b><span>recognitions</span></div></div></section>
  <div className="grid-2" style={{marginTop:18}}><section className="panel"><h3>Performance evidence</h3>{c.metrics.map(m=><div key={m.label} style={{marginTop:10}}><div className="metric"><span>{m.label}</span><b>{m.value}%</b></div><div className="progress"><span style={{width:`${m.value}%`}}/></div></div>)}</section><section className="panel"><h3>Professional highlights</h3>{own.training.slice(0,8).map((x:any)=><div className="metric" key={`t-${x.id}`}><span>{x.title||'Training'}</span><b>{x.provider||'CPD'}</b></div>)}{own.achievements.slice(0,8).map((x:any)=><div className="metric" key={`a-${x.id}`}><span>{x.title||x.badge_name||'Achievement'}</span><b>Recognition</b></div>)}</section></div>
  <section className="panel" style={{marginTop:18}}><h3>Development goals</h3>{own.goals.map((x:any)=><div className="metric" key={x.id}><span>{x.title}</span><b>{x.status}</b></div>)}{!own.goals.length&&<div className="empty">No goals recorded.</div>}</section>
 </div>
}
