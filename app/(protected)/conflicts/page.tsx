'use client'
import Link from 'next/link'
import { AlertTriangle,CheckCircle2,CalendarClock } from 'lucide-react'
import { useData } from '@/components/DataProvider'

type Conflict={severity:'High'|'Medium'|'Low';type:string;title:string;detail:string;href:string}
const DAY=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const mins=(t:string)=>{const [h,m]=String(t||'00:00').slice(0,5).split(':').map(Number);return h*60+m}
const overlap=(a1:number,a2:number,b1:number,b2:number)=>a1<b2&&b1<a2
const rank=(s:'High'|'Medium'|'Low')=>({High:0,Medium:1,Low:2}[s])
const broadAudience=(v:any)=>['all staff','teachers','all teachers','staff','whole school','school'].includes(String(v||'').trim().toLowerCase())

export default function Conflicts(){
 const {data,loading}=useData();if(loading)return <div className="loading">Scanning calendars and schedules…</div>
 const conflicts:Conflict[]=[]
 const entries=data.timetable_entries||[],periods=data.school_periods||[],teachers=data.teachers_dashboard||[],classes=data.timetable_classes||[],leaves=data.leave_requests||[],duties=data.duty_roster||[],meetings=data.staff_meetings||[],events=data.school_events||[],subs=data.timetable_substitutions||[],exams=data.exam_responsibilities||[]
 const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))?.name||`Teacher ${id}`
 const clazz=(id:any)=>classes.find((c:any)=>String(c.id)===String(id))?.name||`Class ${id}`
 const period=(id:any)=>periods.find((p:any)=>Number(p.id)===Number(id))

 // Timetable duplicate/import safety scan.
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){const a=entries[i],b=entries[j];if(a.day_of_week!==b.day_of_week||a.period_id!==b.period_id)continue
  if(a.teacher_id===b.teacher_id)conflicts.push({severity:'High',type:'Teacher clash',title:`${teacher(a.teacher_id)} is double-booked`,detail:`${DAY[a.day_of_week]}, ${period(a.period_id)?.label}: ${clazz(a.class_id)} and ${clazz(b.class_id)}.`,href:'/timetable'})
  if(a.class_id===b.class_id)conflicts.push({severity:'High',type:'Class clash',title:`${clazz(a.class_id)} has two lessons`,detail:`${DAY[a.day_of_week]}, ${period(a.period_id)?.label}: ${a.subject} and ${b.subject}.`,href:'/timetable'})
  if(a.room&&b.room&&String(a.room).trim().toLowerCase()===String(b.room).trim().toLowerCase())conflicts.push({severity:'High',type:'Room clash',title:`${a.room} is double-booked`,detail:`${DAY[a.day_of_week]}, ${period(a.period_id)?.label}.`,href:'/timetable'})
 }

 // Approved leave against regular timetable.
 leaves.filter((l:any)=>l.status==='Approved').forEach((l:any)=>{const start=new Date(l.start_date+'T00:00:00'),end=new Date(l.end_date+'T00:00:00');for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const dow=d.getDay();if(dow<1||dow>5)continue;entries.filter((e:any)=>String(e.teacher_id)===String(l.teacher_id)&&Number(e.day_of_week)===dow).forEach((e:any)=>{const date=d.toISOString().slice(0,10);const covered=subs.some((s:any)=>s.timetable_entry_id===e.id&&s.date===date&&s.status!=='Cancelled');if(!covered)conflicts.push({severity:'High',type:'Leave cover',title:`${teacher(l.teacher_id)} is absent during ${e.subject}`,detail:`${date}, ${period(e.period_id)?.label}, ${clazz(e.class_id)} has no active substitute.`,href:'/leave'})})}})

 // Substitute imported-data clash scan.
 subs.filter((s:any)=>s.status!=='Cancelled').forEach((s:any)=>{const base=entries.find((e:any)=>String(e.id)===String(s.timetable_entry_id));if(!base)return;const dow=new Date(s.date+'T00:00:00').getDay();const regular=entries.find((e:any)=>String(e.teacher_id)===String(s.substitute_teacher_id)&&Number(e.day_of_week)===dow&&Number(e.period_id)===Number(base.period_id));if(regular)conflicts.push({severity:'High',type:'Substitute clash',title:`${teacher(s.substitute_teacher_id)} is not free for substitution`,detail:`${s.date}, ${period(base.period_id)?.label}: already teaching ${regular.subject}.`,href:'/leave'})})

 // Duty roster against timetable.
 duties.filter((d:any)=>d.status!=='Cancelled').forEach((d:any)=>{const date=new Date(d.duty_date+'T00:00:00'),dow=date.getDay();if(dow<1||dow>5)return;entries.filter((e:any)=>String(e.teacher_id)===String(d.teacher_id)&&Number(e.day_of_week)===dow).forEach((e:any)=>{const p=period(e.period_id);if(!p)return;const d1=d.start_time?mins(d.start_time):0,d2=d.end_time?mins(d.end_time):1440;if(overlap(mins(p.start_time),mins(p.end_time),d1,d2))conflicts.push({severity:'Medium',type:'Duty conflict',title:`${teacher(d.teacher_id)} has duty during a lesson`,detail:`${d.duty_date}: ${d.duty_type} overlaps ${e.subject} (${p.label}).`,href:'/duties'})})})

 // Meetings during teaching time.
 meetings.forEach((m:any)=>{const dt=new Date(m.meeting_at),dow=dt.getDay();if(dow<1||dow>5)return;const minute=dt.getHours()*60+dt.getMinutes();const p=periods.find((p:any)=>!p.is_interval&&minute>=mins(p.start_time)&&minute<mins(p.end_time));if(p){const affected=entries.filter((e:any)=>Number(e.day_of_week)===dow&&Number(e.period_id)===Number(p.id)).length;if(affected)conflicts.push({severity:'Medium',type:'Meeting conflict',title:`${m.title} overlaps teaching time`,detail:`${dt.toLocaleString('en-GB',{timeZone:'Asia/Colombo'})} falls in ${p.label}; ${affected} scheduled lesson(s) may be affected.`,href:'/meetings'})}})

 // School-wide events during teaching time, with broader audience recognition.
 events.filter((e:any)=>broadAudience(e.audience)).forEach((e:any)=>{const st=new Date(e.start_at),en=new Date(e.end_at||e.start_at);const dow=st.getDay();if(dow<1||dow>5)return;periods.filter((p:any)=>!p.is_interval).forEach((p:any)=>{const p1=mins(p.start_time),p2=mins(p.end_time),s=st.getHours()*60+st.getMinutes(),ee=en.getHours()*60+en.getMinutes();if(overlap(p1,p2,s,ee)){const count=entries.filter((x:any)=>Number(x.day_of_week)===dow&&Number(x.period_id)===Number(p.id)).length;if(count)conflicts.push({severity:'Medium',type:'Calendar conflict',title:`${e.title} overlaps ${p.label}`,detail:`${st.toLocaleDateString('en-GB',{timeZone:'Asia/Colombo'})}: ${count} lesson(s) overlap this ${String(e.audience||'school-wide').toLowerCase()} event.`,href:'/calendar'})}})})

 // Exam duties with explicit date/time against lessons, approved leave and duty roster.
 exams.filter((x:any)=>x.duty_date&&x.start_time&&x.end_time&&x.status!=='Completed').forEach((x:any)=>{const dow=new Date(x.duty_date+'T00:00:00').getDay(),x1=mins(x.start_time),x2=mins(x.end_time)
  entries.filter((e:any)=>String(e.teacher_id)===String(x.teacher_id)&&Number(e.day_of_week)===dow).forEach((e:any)=>{const p=period(e.period_id);if(p&&overlap(x1,x2,mins(p.start_time),mins(p.end_time)))conflicts.push({severity:'High',type:'Exam duty clash',title:`${teacher(x.teacher_id)} has an exam duty during ${e.subject}`,detail:`${x.duty_date} ${x.start_time}-${x.end_time}: ${x.exam_name} ${x.responsibility} overlaps ${p.label}.`,href:'/exams'})})
  if(leaves.some((l:any)=>String(l.teacher_id)===String(x.teacher_id)&&l.status==='Approved'&&x.duty_date>=l.start_date&&x.duty_date<=l.end_date))conflicts.push({severity:'High',type:'Exam / leave clash',title:`${teacher(x.teacher_id)} has an exam duty while on approved leave`,detail:`${x.duty_date}: ${x.exam_name} · ${x.responsibility}.`,href:'/exams'})
  duties.filter((d:any)=>String(d.teacher_id)===String(x.teacher_id)&&d.duty_date===x.duty_date&&d.status!=='Cancelled').forEach((d:any)=>{const d1=d.start_time?mins(d.start_time):0,d2=d.end_time?mins(d.end_time):1440;if(overlap(x1,x2,d1,d2))conflicts.push({severity:'High',type:'Exam / duty clash',title:`${teacher(x.teacher_id)} has overlapping exam and roster duties`,detail:`${x.duty_date}: ${x.exam_name} overlaps ${d.duty_type}.`,href:'/exams'})})
 })

 // Duplicate/overlapping duties and exam duties.
 for(let i=0;i<duties.length;i++)for(let j=i+1;j<duties.length;j++){const a=duties[i],b=duties[j];if(a.status==='Cancelled'||b.status==='Cancelled'||a.teacher_id!==b.teacher_id||a.duty_date!==b.duty_date)continue;const a1=a.start_time?mins(a.start_time):0,a2=a.end_time?mins(a.end_time):1440,b1=b.start_time?mins(b.start_time):0,b2=b.end_time?mins(b.end_time):1440;if(overlap(a1,a2,b1,b2))conflicts.push({severity:'Medium',type:'Duty clash',title:`${teacher(a.teacher_id)} has overlapping duties`,detail:`${a.duty_date}: ${a.duty_type} and ${b.duty_type}.`,href:'/duties'})}
 const scheduledExams=exams.filter((x:any)=>x.duty_date&&x.start_time&&x.end_time&&x.status!=='Completed')
 for(let i=0;i<scheduledExams.length;i++)for(let j=i+1;j<scheduledExams.length;j++){const a=scheduledExams[i],b=scheduledExams[j];if(a.teacher_id!==b.teacher_id||a.duty_date!==b.duty_date)continue;if(overlap(mins(a.start_time),mins(a.end_time),mins(b.start_time),mins(b.end_time)))conflicts.push({severity:'High',type:'Exam duty clash',title:`${teacher(a.teacher_id)} has overlapping exam duties`,detail:`${a.duty_date}: ${a.exam_name} and ${b.exam_name}.`,href:'/exams'})}

 const unique=Array.from(new Map(conflicts.map(c=>[`${c.type}|${c.title}|${c.detail}`,c])).values())
 const high=unique.filter(c=>c.severity==='High').length,medium=unique.filter(c=>c.severity==='Medium').length
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Cross-module scheduling intelligence</span><h1 style={{marginTop:14}}>Calendar conflict detection</h1><p>Checks timetable, leave, substitutions, duties, meetings, rooms, school events and scheduled exam responsibilities.</p></div><span className={`status ${unique.length===0?'good':''}`}>{unique.length===0?<><CheckCircle2 size={14}/> No conflicts</>:<><AlertTriangle size={14}/> {unique.length} found</>}</span></div>
 <div className="kpis"><div className="kpi"><small>HIGH PRIORITY</small><b>{high}</b><span>Requires immediate attention</span></div><div className="kpi"><small>MEDIUM</small><b>{medium}</b><span>Operational overlap</span></div><div className="kpi"><small>MODULES SCANNED</small><b>8</b><span>Including exam duties</span></div><div className="kpi"><small>STATUS</small><b style={{fontSize:20}}>{unique.length?'Review':'Clear'}</b><span>Live calculation</span></div></div>
 <section className="panel"><div className="panel-head"><div><h2>Detected conflicts</h2><p>Resolve the highest-severity items first.</p></div><CalendarClock/></div><div className="cms-queue">{unique.sort((a,b)=>rank(a.severity)-rank(b.severity)).map((c,i)=><Link href={c.href} className="queue-row" key={i}><div><b>{c.title}</b><small>{c.type} · {c.detail}</small></div><span className={`status ${c.severity==='Low'?'good':''}`}>{c.severity}</span></Link>)}</div>{!unique.length&&<div className="empty"><CheckCircle2 size={28}/><br/>No timetable or calendar conflicts detected in the currently visible records.</div>}</section></>
}
