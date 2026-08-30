'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Activity, Award, BookOpen, BriefcaseBusiness, CalendarDays, Clipboard, GraduationCap, MessageSquareText } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { composite, performanceTrend, teacherRows } from '@/lib/teacherInsights'

export default function Teacher360(){
  const {data,loading,profile,role}=useData()
  const teachers=data.teachers_dashboard||[]
  const leadership=['principal','vice_principal','section_head','reviewer'].includes(role)
  const initial=leadership?String(teachers[0]?.id||''):String(profile?.teacher_id||teachers[0]?.id||'')
  const [selected,setSelected]=useState(initial),[qrValue,setQrValue]=useState('')
  useEffect(()=>{const v=new URLSearchParams(window.location.search).get('teacher');if(v)setSelected(v);setQrValue(window.location.href)},[])
  const teacher=teachers.find((t:any)=>String(t.id)===selected)||teachers.find((t:any)=>String(t.id)===String(profile?.teacher_id))||teachers[0]

  const timeline=useMemo(()=>{
    if(!teacher)return []
    const id=String(teacher.id)
    const own=(name:string)=>(data[name]||[]).filter((x:any)=>String(x.teacher_id)===id)
    return [
      ...own('attendance').map((x:any)=>({date:x.date,title:`Attendance: ${x.status}`,type:'Attendance',icon:Activity})),
      ...own('feedback').map((x:any)=>({date:x.date||x.created_at,title:`Feedback · ${x.rating}/5`,type:x.category||'Feedback',icon:MessageSquareText})),
      ...own('training').map((x:any)=>({date:x.date||x.created_at,title:x.title||'Training',type:'Professional development',icon:GraduationCap})),
      ...own('lessons').map((x:any)=>({date:x.date||x.created_at,title:x.title||'Lesson plan',type:`Lesson plan · ${x.status||''}`,icon:BookOpen})),
      ...own('achievements').map((x:any)=>({date:x.awarded_date||x.date||x.created_at,title:x.title||x.badge_name||'Achievement',type:'Recognition',icon:Award})),
      ...own('teacher_service_history').map((x:any)=>({date:x.effective_date,title:x.title||'Career milestone',type:x.event_type||'Service',icon:BriefcaseBusiness})),
      ...own('goals').map((x:any)=>({date:x.due_date||x.created_at,title:x.title||'Development goal',type:`Goal · ${x.status||''}`,icon:CalendarDays})),
    ].filter(x=>x.date).sort((a,b)=>String(b.date).localeCompare(String(a.date)))
  },[data,teacher])

  if(loading)return <div className="loading">Building 360° profile…</div>
  if(!teacher)return <div className="panel empty">No teacher profiles available.</div>
  const score=composite(data,teacher)
  const trend=performanceTrend(data,teacher)
  const own=teacherRows(data,teacher.id)

  return <>
    <div className="page-head">
      <div><span className="eyebrow"><i className="dot"/>Teacher 360°</span><h1 style={{marginTop:14}}>Professional profile timeline</h1><p>One evidence trail across teaching, development, feedback, attendance and career milestones.</p></div>
      {leadership&&<select className="search" value={String(teacher.id)} onChange={e=>setSelected(e.target.value)}>{teachers.map((t:any)=><option key={t.id} value={t.id}>{t.teacher_code||`ID ${t.id}`} · {t.name}</option>)}</select>}
    </div>

    <section className="panel">
      <div className="panel-head"><div><small>{teacher.teacher_code||`ID ${teacher.id}`}</small><h2>{teacher.name}</h2><p>{teacher.subject||'Teacher'} · {teacher.department||'No department'} · {teacher.section||'No section'}</p></div><div className="toolbar">{teacher.teacher_code&&<button className="btn" onClick={()=>navigator.clipboard?.writeText(teacher.teacher_code)} title="Copy teacher code"><Clipboard size={14}/> Copy code</button>}<span className={`status ${trend.direction==='Improving'?'good':''}`}>{trend.symbol} {trend.direction}</span></div></div>
      <div className="kpis">
        <div className="kpi"><small>COMPOSITE</small><b>{score.score}%</b><span>Transparent weighted score</span></div>
        <div className="kpi"><small>TRAINING</small><b>{own.training.length}</b><span>Development records</span></div>
        <div className="kpi"><small>FEEDBACK</small><b>{own.feedback.length}</b><span>Feedback records</span></div>
        <div className="kpi"><small>ACHIEVEMENTS</small><b>{own.achievements.length}</b><span>Recognitions</span></div>
      </div>
      <div className="toolbar" style={{marginTop:16}}><Link className="btn" href="/pathway">Development pathway →</Link><Link className="btn" href="/portfolio">Printable portfolio →</Link><details className="qr-profile-menu"><summary className="btn">Profile QR</summary><div className="qr-profile-card">{qrValue?<QRCodeSVG value={`${qrValue.split('?')[0]}?teacher=${teacher.id}`} size={126}/>:<div className="qr-placeholder"/>}<small>Authorized users must still sign in.</small></div></details></div>
    </section>

    <section className="panel" style={{marginTop:18}}>
      <div className="panel-head"><div><h3>Professional timeline</h3><p>{timeline.length} evidence item{timeline.length===1?'':'s'} across the teacher lifecycle</p></div></div>
      <div className="timeline">
        {timeline.slice(0,80).map((x:any,i)=>{const Icon=x.icon;return <div className="timeline-item" key={`${x.type}-${x.date}-${i}`}><div style={{display:'flex',gap:10,alignItems:'flex-start'}}><Icon size={17}/><div><b>{x.title}</b><small>{x.type} · {String(x.date).slice(0,10)}</small></div></div></div>})}
        {!timeline.length&&<div className="empty">Activity will build automatically as records are added.</div>}
      </div>
    </section>
  </>
}
