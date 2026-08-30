'use client'
import { Award,Star,Trophy } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { growthStreak } from '@/lib/advancedUx'
export default function AchievementWall(){
 const{data,loading}=useData();if(loading)return <div className="loading">Preparing achievement wall…</div>
 const teachers=data.teachers_dashboard||[],ach=[...(data.achievements||[])].sort((a:any,b:any)=>String(b.date).localeCompare(String(a.date))).slice(0,24)
 return <div className="achievement-wall-page"><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Celebration display</span><h1 style={{marginTop:14}}>School Achievement Wall</h1><p>Presentation-friendly recognition without exposing confidential performance data.</p></div></div><div className="achievement-wall-grid">{ach.map((a:any,i)=><article className="achievement-wall-card" key={a.id}>{i%3===0?<Trophy/>:i%3===1?<Award/>:<Star/>}<small>{a.date}</small><h2>{a.badge}</h2><h3>{teachers.find((t:any)=>String(t.id)===String(a.teacher_id))?.name||'Teacher'}</h3><p>{a.description}</p><span>{growthStreak(data,a.teacher_id)} month growth streak</span></article>)}</div></div>
}