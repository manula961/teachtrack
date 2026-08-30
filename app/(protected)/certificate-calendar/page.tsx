'use client'
import { useState } from 'react'
import { useData } from '@/components/DataProvider'
export default function CertificateCalendar(){
 const{data,loading}=useData();const[days,setDays]=useState(90);if(loading)return <div className="loading">Building expiry calendar…</div>
 const today=new Date(),limit=new Date(Date.now()+days*86400000)
 const rows=(data.teacher_documents||[]).filter((x:any)=>x.expiry_date&&new Date(x.expiry_date)>=today&&new Date(x.expiry_date)<=limit).sort((a:any,b:any)=>String(a.expiry_date).localeCompare(String(b.expiry_date)))
 const teachers=data.teachers_dashboard||[]
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Certificate expiry</span><h1 style={{marginTop:14}}>30 / 60 / 90 day timeline</h1><p>See qualifications and certificates before they expire.</p></div><div className="segmented">{[30,60,90].map(x=><button key={x} className={days===x?'active':''} onClick={()=>setDays(x)}>{x} days</button>)}</div></div><section className="panel"><div className="timeline">{rows.map((x:any)=><div className="timeline-item" key={x.id}><b>{x.title}</b><small>{teachers.find((t:any)=>String(t.id)===String(x.teacher_id))?.name||`Teacher ${x.teacher_id}`} · expires {x.expiry_date}</small></div>)}{!rows.length&&<div className="empty">No documents expire in the selected window.</div>}</div></section></>
}