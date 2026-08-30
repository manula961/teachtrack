'use client'
import { Award, Medal, Trophy } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { composite, performanceTrend, teacherRows } from '@/lib/teacherInsights'

export default function Leaderboard(){
 const {data,loading}=useData();const teachers=data.teachers_dashboard||[]
 if(loading)return <div className="loading">Calculating recognition board…</div>
 const scored=teachers.map((t:any)=>{const c=composite(data,t);const own=teacherRows(data,t.id);const trend=performanceTrend(data,t);return {...t,score:c.score,training:own.training.length,ach:own.achievements.length,trend}}).sort((a:any,b:any)=>b.score-a.score)
 const awards=[
  ['Teaching Excellence',scored[0],Trophy],
  ['Most Improved',[...scored].sort((a:any,b:any)=>b.trend.delta-a.trend.delta)[0],Medal],
  ['Professional Development Champion',[...scored].sort((a:any,b:any)=>b.training-a.training)[0],Award],
  ['Recognition Champion',[...scored].sort((a:any,b:any)=>b.ach-a.ach)[0],Award],
 ]
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>School excellence</span><h1 style={{marginTop:14}}>Recognition & gamification board</h1><p>Celebrate positive development signals without turning professional growth into a punitive ranking.</p></div></div>
  <div className="cards">{awards.map(([label,t,Icon]:any)=>t&&<article className="person-card" key={label}><Icon size={28}/><small style={{display:'block',marginTop:12}}>{label.toUpperCase()}</small><h3>{t.name}</h3><p>{t.teacher_code||`ID ${t.id}`} · {t.subject||'Teacher'}</p><div className="metric"><span>Performance</span><b>{t.score}%</b></div></article>)}</div>
  <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h3>Excellence board</h3><p>Composite score with development context</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Teacher</th><th>Department</th><th>Score</th><th>Trend</th><th>Training</th><th>Achievements</th></tr></thead><tbody>{scored.map((t:any,i:number)=><tr key={t.id}><td>{i+1}</td><td><b>{t.name}</b><small style={{display:'block'}}>{t.teacher_code||`ID ${t.id}`}</small></td><td>{t.department||'—'}</td><td>{t.score}%</td><td>{t.trend.symbol} {t.trend.direction}</td><td>{t.training}</td><td>{t.ach}</td></tr>)}</tbody></table></div></section>
 </>
}
