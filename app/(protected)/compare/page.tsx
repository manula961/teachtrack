'use client'
import { useEffect, useMemo, useState } from 'react'
import { useData } from '@/components/DataProvider'
import { composite, performanceTrend } from '@/lib/teacherInsights'

export default function Compare(){
 const {data,loading,role}=useData();const teachers=data.teachers_dashboard||[]
 const [ids,setIds]=useState<string[]>([])
 useEffect(()=>{if(!ids.length&&teachers.length)setIds(teachers.slice(0,3).map((t:any)=>String(t.id)))},[teachers,ids.length])
 const selected=useMemo(()=>ids.map(id=>teachers.find((t:any)=>String(t.id)===id)).filter(Boolean),[ids,teachers])
 function setAt(i:number,v:string){setIds(prev=>{const n=[...prev];n[i]=v;return n})}
 if(loading)return <div className="loading">Preparing fair comparison…</div>
 if(!['principal','vice_principal','section_head','reviewer'].includes(role))return <div className="panel empty">Teacher comparison is available to school leadership and reviewers.</div>
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Teacher comparison</span><h1 style={{marginTop:14}}>Evidence-based comparison</h1><p>Compare 2–4 teachers using the same transparent indicators. Use department and section context rather than rank alone.</p></div></div>
  <section className="panel"><div className="form-grid">{[0,1,2,3].map(i=><div className="field" key={i}><label>TEACHER {i+1}</label><select value={ids[i]||''} onChange={e=>setAt(i,e.target.value)}><option value="">{i<2?'Select teacher':'Optional'}</option>{teachers.map((t:any)=><option key={t.id} value={t.id}>{t.teacher_code||`ID ${t.id}`} · {t.name}</option>)}</select></div>)}</div></section>
  <section className="panel" style={{marginTop:18}}><div className="table-wrap"><table className="table"><thead><tr><th>Indicator</th>{selected.map((t:any)=><th key={t.id}>{t.name}<small style={{display:'block',fontWeight:500}}>{t.department||'—'} · {t.section||'—'}</small></th>)}</tr></thead><tbody>
   {['Composite','Attendance','Punctuality','Observation','Feedback','Lesson planning','Training','Achievements','Trend'].map(label=><tr key={label}><td><b>{label}</b></td>{selected.map((t:any)=>{const c=composite(data,t);const metric=c.metrics.find(m=>m.label===label);const trend=performanceTrend(data,t);return <td key={t.id}>{label==='Composite'?`${c.score}%`:label==='Trend'?`${trend.symbol} ${trend.direction}${trend.delta?` (${trend.delta>0?'+':''}${trend.delta})`:''}`:`${metric?.value??0}%`}</td>})}</tr>)}
  </tbody></table>{selected.length<2&&<div className="empty">Select at least two teachers.</div>}</div></section>
  <div className="command" style={{marginTop:18}}><div><small>FAIR USE</small><b>Comparison supports coaching decisions; it should not replace contextual professional judgment.</b></div><i className="pulse"/></div>
 </>
}
