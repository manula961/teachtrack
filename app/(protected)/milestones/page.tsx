'use client'
import { useData } from '@/components/DataProvider'
export default function Milestones(){
 const{data,loading,profile}=useData();if(loading)return <div className="loading">Building milestone timeline…</div>
 const t=(data.teachers_dashboard||[]).find((x:any)=>String(x.id)===String(profile?.teacher_id))||(data.teachers_dashboard||[])[0];if(!t)return <div className="panel empty">No teacher profile.</div>
 const id=String(t.id),service=(data.teacher_service_history||[]).filter((x:any)=>String(x.teacher_id)===id),training=(data.training||[]).filter((x:any)=>String(x.teacher_id)===id),ach=(data.achievements||[]).filter((x:any)=>String(x.teacher_id)===id)
 const rows=[...service.map((x:any)=>({date:x.effective_date,title:x.title,type:x.event_type})),...training.map((x:any)=>({date:x.date,title:x.title,type:'Training'})),...ach.map((x:any)=>({date:x.date,title:x.badge,type:'Achievement'}))].sort((a,b)=>String(b.date).localeCompare(String(a.date)))
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Career journey</span><h1 style={{marginTop:14}}>Personal milestone timeline</h1><p>{t.name} · qualifications, service, learning and recognition.</p></div></div><section className="panel"><div className="timeline">{rows.map((x:any,i)=><div className="timeline-item" key={i}><b>{x.title}</b><small>{x.type} · {x.date}</small></div>)}{!rows.length&&<div className="empty">Career milestones will appear here.</div>}</div></section></>
}