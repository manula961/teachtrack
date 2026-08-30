'use client'
import { useState } from 'react'
import { useData } from '@/components/DataProvider'
export default function PeriodCompare(){
 const{data,loading,profile,role}=useData();const leadership=['principal','vice_principal','section_head','reviewer'].includes(role);const teachers=data.teachers_dashboard||[];const[id,setId]=useState('');const[cut,setCut]=useState(new Date().getFullYear()+'-01-01')
 if(loading)return <div className="loading">Comparing periods…</div>
 const t=teachers.find((x:any)=>String(x.id)===id)||teachers.find((x:any)=>String(x.id)===String(profile?.teacher_id))||teachers[0];if(!t)return <div className="panel empty">No teachers.</div>
 const own=(name:string)=>(data[name]||[]).filter((x:any)=>String(x.teacher_id)===String(t.id))
 const summarize=(before:boolean)=>{
  const pred=(x:any)=>{const d=String(x.date||x.created_at||'').slice(0,10);return before?d<cut:d>=cut}
  const att=own('attendance').filter(pred),fb=own('feedback').filter(pred),obs=own('observations').filter(pred),tr=own('training').filter(pred)
  return {attendance:att.length?Math.round(att.filter((x:any)=>x.status!=='Absent').length/att.length*100):0,feedback:fb.length?(fb.reduce((s:number,x:any)=>s+Number(x.rating||0),0)/fb.length).toFixed(1):'0.0',observation:obs.length?(obs.reduce((s:number,x:any)=>s+Number(x.rating||0),0)/obs.length).toFixed(1):'0.0',training:tr.length}
 }
 const a=summarize(true),b=summarize(false)
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Period comparison</span><h1 style={{marginTop:14}}>Before vs after development</h1><p>Compare evidence around a chosen date such as training, a goal start or a new term.</p></div><div className="toolbar">{leadership&&<select className="search" value={String(t.id)} onChange={e=>setId(e.target.value)}>{teachers.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select>}<input className="search" type="date" value={cut} onChange={e=>setCut(e.target.value)}/></div></div>
 <section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Indicator</th><th>Before {cut}</th><th>After {cut}</th><th>Change</th></tr></thead><tbody>{[['Attendance %','attendance'],['Feedback /5','feedback'],['Observation /5','observation'],['Training records','training']].map(([label,k])=>{const av=Number((a as any)[k]),bv=Number((b as any)[k]);return <tr key={k}><td><b>{label}</b></td><td>{(a as any)[k]}</td><td>{(b as any)[k]}</td><td>{bv-av>0?'+':''}{(bv-av).toFixed(1)}</td></tr>})}</tbody></table></div></section></>
}