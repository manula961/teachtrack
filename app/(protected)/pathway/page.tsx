'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Target } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { recommendedPathway, performanceTrend } from '@/lib/teacherInsights'

export default function Pathway(){
 const {data,loading,profile,role,insert}=useData();const teachers=data.teachers_dashboard||[];const leadership=['principal','vice_principal','section_head','reviewer'].includes(role);const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false)
 const [selected,setSelected]=useState(leadership?String(teachers[0]?.id||''):String(profile?.teacher_id||teachers[0]?.id||''))
 const teacher=teachers.find((t:any)=>String(t.id)===selected)||teachers.find((t:any)=>String(t.id)===String(profile?.teacher_id))||teachers[0]
 if(loading)return <div className="loading">Building development pathway…</div>
 if(!teacher)return <div className="panel empty">No teacher records available.</div>
 const path=recommendedPathway(data,teacher);const trend=performanceTrend(data,teacher)
 async function createGoal(){
  setBusy(true);setMsg('')
  const due=new Date(Date.now()+90*86400000).toISOString().slice(0,10)
  try{
   await insert('goals',{teacher_id:Number(teacher.id),title:`Improve ${path.weakest.label}`,category:path.weakest.label,current_value:path.weakest.value,target_value:Math.min(100,path.weakest.value+15),unit:'%',due_date:due,status:'Active'})
   setMsg(`Development goal created for ${teacher.name}.`)
  }catch(err:any){setMsg(err?.message||'Unable to create goal.')}
  setBusy(false)
 }
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Professional development pathway</span><h1 style={{marginTop:14}}>From evidence to growth</h1><p>Explainable recommendations connect performance evidence to goals, professional learning and review.</p></div>{leadership&&<select className="search" value={String(teacher.id)} onChange={e=>setSelected(e.target.value)}>{teachers.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}</div>
  <div className="grid"><section className="panel"><div className="panel-head"><div><small>PRIORITY DEVELOPMENT AREA</small><h2>{path.weakest.label}</h2><p>{path.weakest.value}% current component score</p></div><Target size={30}/></div><div className="progress"><span style={{width:`${path.weakest.value}%`}}/></div><p style={{marginTop:16}}>The recommendation is generated from the same visible metrics used in Growth Intelligence. No hidden AI scoring is used.</p></section>
  <section className="panel"><div className="panel-head"><div><h3>Current trajectory</h3><p>Recent feedback, observations and attendance evidence</p></div></div><div className="hero-score">{trend.symbol}</div><h3>{trend.direction}</h3><p>{trend.delta===0?'Not enough movement for a significant trend.':`${trend.delta>0?'+':''}${trend.delta} point change between earlier and recent evidence.`}</p></section></div>
  {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
  <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h3>Recommended 3-step pathway</h3><p>Turn the development opportunity into an actionable cycle.</p></div></div>{path.steps.map((s,i)=><div className="queue-row" key={s}><div style={{display:'flex',gap:10,alignItems:'center'}}><CheckCircle2 size={18}/><div><b>{i+1}. {s}</b><small>{i===0?'Plan':i===1?'Develop':'Review & recognize'}</small></div></div></div>)}<div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary" onClick={createGoal} disabled={busy}>{busy?'Creating…':'Create recommended goal'}</button><Link href="/goals" className="btn">Open goals →</Link><Link href="/training" className="btn">Add training →</Link><Link href="/observations" className="btn">Schedule evidence →</Link></div></section>
 </>
}
