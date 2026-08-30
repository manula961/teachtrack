'use client'
import { useState } from 'react'
import { Award,Printer } from 'lucide-react'
import { useData } from '@/components/DataProvider'
export default function RecognitionCards(){
 const{data,loading}=useData();const ach=data.achievements||[],teachers=data.teachers_dashboard||[];const[id,setId]=useState(String(ach[0]?.id||''));if(loading)return <div className="loading">Preparing recognition card…</div>
 const a=ach.find((x:any)=>String(x.id)===id)||ach[0];if(!a)return <div className="panel empty">Add an achievement first.</div>;const t=teachers.find((x:any)=>String(x.id)===String(a.teacher_id))
 return <div className="recognition-print"><div className="page-head no-print"><div><span className="eyebrow"><i className="dot"/>Recognition</span><h1 style={{marginTop:14}}>Achievement certificate</h1><p>Print or save a polished internal recognition card.</p></div><div className="toolbar"><select className="search" value={String(a.id)} onChange={e=>setId(e.target.value)}>{ach.map((x:any)=><option value={x.id} key={x.id}>{x.badge} · {teachers.find((t:any)=>String(t.id)===String(x.teacher_id))?.name}</option>)}</select><button className="btn btn-primary" onClick={()=>window.print()}><Printer size={16}/> Print / PDF</button></div></div>
 <section className="panel recognition-certificate"><Award size={56}/><small>TEACHTRACK SCHOOL RECOGNITION</small><h1>{a.badge}</h1><h2>{t?.name||'Teacher'}</h2><p>{a.description}</p><div className="recognition-rule"/><b>{a.date}</b><small>{t?.teacher_code||''} · {t?.department||''}</small></section></div>
}