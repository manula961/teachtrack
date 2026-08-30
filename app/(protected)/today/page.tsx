'use client'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock3, UserRoundCheck } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { derivedAlerts } from '@/lib/teacherInsights'

export default function Today(){
 const {data,loading,profile,role}=useData()
 if(loading)return <div className="loading">Preparing today…</div>
 const today=new Date().toISOString().slice(0,10)
 const leadership=['principal','vice_principal','section_head','reviewer'].includes(role)
 const teacherId=String(profile?.teacher_id||'')
 const mine=(rows:any[])=>leadership?rows:rows.filter((x:any)=>String(x.teacher_id)===teacherId)
 const leaves=mine(data.leave_requests||[]).filter((x:any)=>x.start_date<=today&&x.end_date>=today)
 const duties=mine(data.duty_roster||[]).filter((x:any)=>String(x.duty_date||x.date||'').slice(0,10)===today)
 const exams=mine(data.exam_responsibilities||[]).filter((x:any)=>String(x.duty_date||'').slice(0,10)===today)
 const meetings=(data.staff_meetings||[]).filter((x:any)=>String(x.meeting_date||x.date||x.start_at||'').slice(0,10)===today)
 const events=(data.school_events||[]).filter((x:any)=>String(x.start_at||'').slice(0,10)===today)
 const alerts=derivedAlerts(data).filter((x:any)=>leadership||String(x.teacher_id||'')===teacherId).slice(0,8)
 const attendance=mine(data.attendance||[]).filter((x:any)=>String(x.date||'').slice(0,10)===today)
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Daily workspace</span><h1 style={{marginTop:14}}>Today</h1><p>{new Date().toLocaleDateString('en-GB',{timeZone:'Asia/Colombo',weekday:'long',day:'2-digit',month:'short',year:'numeric'})} · everything requiring attention in one place.</p></div><Link href="/calendar" className="btn">Open calendar →</Link></div>
  <div className="kpis"><div className="kpi"><small>TODAY'S EVENTS</small><b>{events.length}</b><span>School calendar</span></div><div className="kpi"><small>MEETINGS</small><b>{meetings.length}</b><span>Scheduled today</span></div><div className="kpi"><small>DUTIES</small><b>{duties.length+exams.length}</b><span>Duty & exam responsibilities</span></div><div className="kpi"><small>ATTENTION</small><b>{alerts.length}</b><span>Smart reminders</span></div></div>
  <div className="grid-2" style={{marginTop:18}}>
   <section className="panel"><div className="panel-head"><div><h3>Schedule</h3><p>Events, meetings and duties</p></div><CalendarDays size={24}/></div>
    {events.map((x:any)=><div className="queue-row" key={`e-${x.id}`}><div><b>{x.title}</b><small>{String(x.start_at||'').slice(11,16)} · {x.location||'School event'}</small></div><span>Event</span></div>)}
    {meetings.map((x:any)=><div className="queue-row" key={`m-${x.id}`}><div><b>{x.title||x.topic||'Staff meeting'}</b><small>{x.start_time||x.time||''} · {x.location||'Meeting'}</small></div><span>Meeting</span></div>)}
    {duties.map((x:any)=><div className="queue-row" key={`d-${x.id}`}><div><b>{x.duty_type||x.title||'School duty'}</b><small>{x.start_time||''} {x.location?`· ${x.location}`:''}</small></div><span>Duty</span></div>)}
    {exams.map((x:any)=><div className="queue-row" key={`x-${x.id}`}><div><b>{x.exam_name||x.subject||'Exam responsibility'}</b><small>{x.start_time||''} {x.location?`· ${x.location}`:''}</small></div><span>Exam</span></div>)}
    {!events.length&&!meetings.length&&!duties.length&&!exams.length&&<div className="empty">Nothing scheduled here yet. Check the timetable or calendar for your next activity.</div>}
   </section>
   <section className="panel"><div className="panel-head"><div><h3>Attention & status</h3><p>Important items for today</p></div><Clock3 size={24}/></div>
    {leaves.map((x:any)=><div className="queue-row" key={`l-${x.id}`}><div><b>Leave · {x.status}</b><small>{x.start_date} → {x.end_date}</small></div><span>Leave</span></div>)}
    {attendance.map((x:any)=><div className="queue-row" key={`a-${x.id}`}><div><b>Attendance · {x.status}</b><small>{x.check_in||x.time_in||'Recorded today'}</small></div><UserRoundCheck size={18}/></div>)}
    {alerts.map((x:any,i:number)=><div className="queue-row" key={`${x.kind}-${i}`}><div><b>{x.title}</b><small>{x.detail}</small></div><span>{x.kind}</span></div>)}
    {!leaves.length&&!attendance.length&&!alerts.length&&<div className="empty">No urgent attention items. You're ready for the day.</div>}
   </section>
  </div>
  <div className="grid-2" style={{marginTop:18}}><Link className="feature-card" href="/timetable"><CheckCircle2 size={20}/><h3>Timetable</h3><p>See teaching periods and substitutions.</p></Link><Link className="feature-card" href="/notifications"><CheckCircle2 size={20}/><h3>Notifications</h3><p>Review announcements and workflow updates.</p></Link></div>
 </>
}
