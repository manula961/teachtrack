'use client'
import Link from 'next/link'
import { AlertTriangle,CheckCircle2,DatabaseZap } from 'lucide-react'
import { useData } from '@/components/DataProvider'

type Issue={severity:'High'|'Medium'|'Low';area:string;title:string;detail:string;href:string}
const rank=(s:'High'|'Medium'|'Low')=>({High:0,Medium:1,Low:2}[s])
export default function DataQuality(){
 const {data,loading,role}=useData();if(loading)return <div className="loading">Auditing school data…</div>
 const issues:Issue[]=[]
 const teachers=data.teachers_dashboard||[],profiles=data.profiles||[],classes=data.timetable_classes||[],entries=data.timetable_entries||[],reqs=data.class_subject_requirements||[],training=data.training||[],docs=data.teacher_documents||[],terms=data.academic_terms||[],departments=data.departments||[]
 const today=new Date().toISOString().slice(0,10)

 teachers.forEach((t:any)=>{
  const missing=[];if(!t.name)missing.push('name');if(!t.subject)missing.push('subject');if(!t.email)missing.push('email')
  if(missing.length)issues.push({severity:'Medium',area:'Teacher profiles',title:`Incomplete teacher profile: ${t.name||`ID ${t.id}`}`,detail:`Missing ${missing.join(', ')}.`,href:'/teachers'})
  if(!profiles.some((p:any)=>String(p.teacher_id)===String(t.id)))issues.push({severity:'Low',area:'Account linking',title:`${t.name||`Teacher ${t.id}`} has no linked login`,detail:'Link profiles.teacher_id so personal timetable, leave and document security work correctly.',href:'/teachers'})
 })
 profiles.filter((p:any)=>p.role==='teacher'&&!p.teacher_id).forEach((p:any)=>issues.push({severity:'High',area:'Account linking',title:`Teacher account is not linked to a teacher record`,detail:`${p.full_name||p.id} has role teacher but no teacher_id.`,href:'/teachers'}))
 classes.forEach((c:any)=>{
  if(!c.class_teacher_id)issues.push({severity:'Low',area:'Classes',title:`${c.name} has no class teacher`,detail:`${c.grade} · ${c.medium}.`,href:'/classes'})
  if(Number(c.student_count||0)===0)issues.push({severity:'Low',area:'Classes',title:`${c.name} has no student count`,detail:'Add the class size for workload and planning context.',href:'/classes'})
  if(!reqs.some((r:any)=>String(r.class_id)===String(c.id)))issues.push({severity:'Medium',area:'Timetable generation',title:`${c.name} has no subject requirements`,detail:'The automatic timetable generator cannot build this class until weekly subject requirements are defined.',href:'/timetable-generator'})
 })
 reqs.forEach((r:any)=>{
  if(!teachers.some((t:any)=>String(t.id)===String(r.teacher_id)))issues.push({severity:'High',area:'Timetable generation',title:`Requirement has missing teacher`,detail:`${r.subject} requirement references teacher ${r.teacher_id}.`,href:'/timetable-generator'})
  const scheduled=entries.filter((e:any)=>String(e.class_id)===String(r.class_id)&&String(e.subject).toLowerCase()===String(r.subject).toLowerCase()).length
  if(scheduled<Number(r.periods_per_week))issues.push({severity:'Medium',area:'Timetable completeness',title:`${r.subject} is under-scheduled`,detail:`${scheduled}/${r.periods_per_week} required weekly periods are currently assigned.`,href:'/timetable-generator'})
 })
 training.filter((t:any)=>t.expiry_date&&t.expiry_date<today).forEach((t:any)=>issues.push({severity:'High',area:'Certifications',title:`Expired certification: ${t.title}`,detail:`Expired ${t.expiry_date}.`,href:'/alerts'}))
 docs.filter((d:any)=>d.expiry_date&&d.expiry_date<today).forEach((d:any)=>issues.push({severity:'High',area:'Documents',title:`Expired document: ${d.title}`,detail:`Expired ${d.expiry_date}.`,href:'/alerts'}))
 if(!terms.some((t:any)=>t.status==='Active'))issues.push({severity:'Medium',area:'Academic setup',title:'No active academic term',detail:'Mark the current term Active so records can be interpreted correctly.',href:'/terms'})
 if(!departments.length)issues.push({severity:'Low',area:'Academic setup',title:'No departments configured',detail:'Department structure improves subject leadership and analytics.',href:'/departments'})

 const duplicateEmail=new Map<string,any[]>();teachers.forEach((t:any)=>{if(t.email){const k=String(t.email).toLowerCase();duplicateEmail.set(k,[...(duplicateEmail.get(k)||[]),t])}})
 duplicateEmail.forEach((rows,email)=>{if(rows.length>1)issues.push({severity:'High',area:'Teacher profiles',title:`Duplicate teacher email: ${email}`,detail:`Used by ${rows.length} teacher records.`,href:'/teachers'})})

 const high=issues.filter(i=>i.severity==='High').length,medium=issues.filter(i=>i.severity==='Medium').length,low=issues.filter(i=>i.severity==='Low').length
 const score=Math.max(0,100-high*8-medium*4-low*2)
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Data integrity intelligence</span><h1 style={{marginTop:14}}>Data Quality Centre</h1><p>Automatically checks teacher profiles, account links, timetable completeness, classes, certifications, documents and academic setup.</p></div><span className={`status ${score>=90?'good':''}`}><DatabaseZap size={14}/> Quality score {score}%</span></div>
 <div className="kpis"><div className="kpi"><small>QUALITY SCORE</small><b>{score}%</b><span>Live integrity estimate</span></div><div className="kpi"><small>HIGH PRIORITY</small><b>{high}</b><span>Fix first</span></div><div className="kpi"><small>MEDIUM</small><b>{medium}</b><span>Incomplete or inconsistent</span></div><div className="kpi"><small>LOW</small><b>{low}</b><span>Recommended cleanup</span></div></div>
 <section className="panel"><div className="panel-head"><div><h2>Quality findings</h2><p>Each finding links directly to the module where it can be corrected.</p></div>{issues.length===0?<CheckCircle2/>:<AlertTriangle/>}</div><div className="cms-queue">{issues.sort((a,b)=>rank(a.severity)-rank(b.severity)).map((i,n)=><Link className="queue-row" href={i.href} key={n}><div><b>{i.title}</b><small>{i.area} · {i.detail}</small></div><span className={`status ${i.severity==='Low'?'good':''}`}>{i.severity}</span></Link>)}</div>{!issues.length&&<div className="empty"><CheckCircle2 size={30}/><br/>No data-quality issues detected in the currently visible records.</div>}</section></>
}
