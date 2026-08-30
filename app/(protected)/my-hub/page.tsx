'use client'
import Link from 'next/link'
import { Activity,BarChart3,ClipboardCheck,FileBarChart,ShieldCheck,UsersRound } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { composite,teacherRows,performanceTrend } from '@/lib/teacherInsights'
import { derivedAlerts } from '@/lib/teacherInsights'

export default function MyHub(){
 const{data,loading,profile,role}=useData()
 const teachers=data.teachers_dashboard||[]
 const t=teachers.find((x:any)=>String(x.id)===String(profile?.teacher_id))
 if(loading)return <div className="loading">Preparing your workspace…</div>

 if(!t&&role!=='teacher'){
  const alerts=derivedAlerts(data)
  const pending=(data.approval_requests||[]).filter((x:any)=>String(x.status).toLowerCase()==='pending').length
  const activeGoals=(data.goals||[]).filter((x:any)=>x.status==='Active'||x.status==='At Risk').length
  return <>
   <div className="page-head">
    <div><span className="eyebrow"><i className="dot"/>Leadership workspace</span><h1 style={{marginTop:14}}>Leadership hub</h1><p>Your management account does not need a teacher-profile link. Use this workspace for school-wide oversight and development actions.</p></div>
    <Link href="/dashboard" className="btn btn-primary">Open Command Center →</Link>
   </div>
   <div className="kpis">
    <div className="kpi"><small>TEACHERS</small><b>{teachers.length}</b><span>Staff profiles</span></div>
    <div className="kpi"><small>ACTION ITEMS</small><b>{alerts.length}</b><span>Needs attention</span></div>
    <div className="kpi"><small>PENDING APPROVALS</small><b>{pending}</b><span>Workflow queue</span></div>
    <div className="kpi"><small>ACTIVE GOALS</small><b>{activeGoals}</b><span>Development targets</span></div>
   </div>
   <div className="leadership-hub-grid">
    <Link className="leadership-hub-card" href="/action-center"><Activity/><div><b>Action Center</b><span>Priorities, deadlines and support indicators</span></div><strong>→</strong></Link>
    <Link className="leadership-hub-card" href="/teachers"><UsersRound/><div><b>Teacher Profiles</b><span>Staff records and professional evidence</span></div><strong>→</strong></Link>
    <Link className="leadership-hub-card" href="/department-health"><BarChart3/><div><b>Department Health</b><span>Compare growth and development signals</span></div><strong>→</strong></Link>
    <Link className="leadership-hub-card" href="/approvals"><ClipboardCheck/><div><b>Approval Workflows</b><span>Review pending school requests</span></div><strong>→</strong></Link>
    <Link className="leadership-hub-card" href="/report-builder"><FileBarChart/><div><b>Management Reports</b><span>Build, print and export reports</span></div><strong>→</strong></Link>
    <Link className="leadership-hub-card" href="/security"><ShieldCheck/><div><b>Audit & Security</b><span>Review access and security activity</span></div><strong>→</strong></Link>
   </div>
  </>
 }

 if(!t)return <section className="panel profile-link-state"><div className="profile-link-icon">!</div><div><small>PROFILE LINK REQUIRED</small><h2>Connect your teacher account</h2><p>This teacher login is not linked to a teacher record yet. Ask the Principal or Vice Principal to connect your account to the correct teacher profile.</p><div className="profile-link-code">profiles.teacher_id → teachers.id</div></div><Link className="btn" href="/help">Open help</Link></section>

 const c=composite(data,t),own=teacherRows(data,t.id),trend=performanceTrend(data,t)
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Teacher self-service</span><h1 style={{marginTop:14}}>My professional hub</h1><p>Your timetable, development evidence, feedback, goals and achievements without management-only data.</p></div><Link href={`/teacher-360?teacher=${t.id}`} className="btn btn-primary">My 360° profile →</Link></div>
  <div className="kpis"><div className="kpi"><small>PERFORMANCE</small><b>{c.score}%</b><span>{trend.symbol} {trend.direction}</span></div><div className="kpi"><small>WEEKLY LESSONS</small><b>{own.timetable.length}</b><span>Timetable entries</span></div><div className="kpi"><small>GOALS</small><b>{own.goals.filter((x:any)=>x.status==='Active').length}</b><span>Active targets</span></div><div className="kpi"><small>ACHIEVEMENTS</small><b>{own.achievements.length}</b><span>Recognitions</span></div></div>
  <div className="grid-2" style={{marginTop:18}}><section className="panel"><div className="panel-head"><div><h3>My development</h3><p>Records linked to your teacher profile</p></div></div>{[['Training',own.training.length,'/training'],['Lesson plans',own.lessons.length,'/lessons'],['Feedback',own.feedback.length,'/feedback'],['Observations',own.observations.length,'/observations'],['Goals',own.goals.length,'/goals']].map(([label,n,href]:any)=><Link className="queue-row" href={href} key={label}><div><b>{label}</b><small>{n} record{n===1?'':'s'}</small></div><span>→</span></Link>)}</section><section className="panel"><div className="panel-head"><div><h3>Quick access</h3><p>Common teacher actions</p></div></div><div className="cms-actions"><Link className="cms-action" href="/timetable"><b>My timetable</b><span>View teaching schedule →</span></Link><Link className="cms-action" href="/leave"><b>Request leave</b><span>Submit and track leave →</span></Link><Link className="cms-action" href="/documents"><b>My documents</b><span>Qualifications and certificates →</span></Link><Link className="cms-action" href="/pathway"><b>Development pathway</b><span>See recommended next steps →</span></Link></div></section></div>
 </>
}
