'use client'
import { useData } from '@/components/DataProvider'
export default function Workload(){
 const {data,loading}=useData();if(loading)return <div className="loading">Calculating workloads…</div>
 const teachers=data.teachers_dashboard||[], entries=data.timetable_entries||[], subs=data.timetable_substitutions||[], training=data.training||[], lessons=data.lessons||[]
 const rows=teachers.map((t:any)=>{const periods=entries.filter((e:any)=>String(e.teacher_id)===String(t.id)).length;const substitutions=subs.filter((s:any)=>String(s.substitute_teacher_id)===String(t.id)).length;const planCount=lessons.filter((l:any)=>String(l.teacher_id)===String(t.id)).length;return {...t,periods,substitutions,planCount}})
 const avg=rows.length?Math.round(rows.reduce((s:number,r:any)=>s+r.periods,0)/rows.length):0
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Workload intelligence</span><h1 style={{marginTop:14}}>Teacher workload analytics</h1><p>Compare weekly teaching load, substitutions and planning activity to support fair allocation.</p></div></div>
 <div className="kpis"><div className="kpi"><small>AVG PERIODS</small><b>{avg}</b><span>Per teacher / week</span></div><div className="kpi"><small>WEEKLY LESSONS</small><b>{entries.length}</b><span>Scheduled school-wide</span></div><div className="kpi"><small>SUBSTITUTIONS</small><b>{subs.length}</b><span>Cover assignments</span></div><div className="kpi"><small>TEACHERS</small><b>{teachers.length}</b><span>Visible faculty</span></div></div>
 <section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th>Subject</th><th>Periods/week</th><th>Load</th><th>Substitutions</th><th>Lesson plans</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><b>{r.name}</b></td><td>{r.subject||'—'}</td><td>{r.periods}</td><td><div style={{minWidth:150}}><div className="workload-bar"><span style={{width:`${Math.min(100,(r.periods/40)*100)}%`}}/></div><small>{r.periods>32?'High':r.periods<15?'Light':'Balanced'}</small></div></td><td>{r.substitutions}</td><td>{r.planCount}</td></tr>)}</tbody></table></div></section></>
}
