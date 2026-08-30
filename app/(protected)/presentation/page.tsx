'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { Award,Maximize2,Users } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { composite } from '@/lib/teacherInsights'
export default function Presentation(){
 const{data,loading}=useData();const[slide,setSlide]=useState(0)
 const teachers=data.teachers_dashboard||[],avg=teachers.length?Math.round(teachers.reduce((s:number,t:any)=>s+composite(data,t).score,0)/teachers.length):0
 const slides=[
  <div className="presentation-slide" key="1"><Users size={58}/><small>TEACHTRACK</small><h1>{teachers.length} Teachers</h1><p>One secure platform for professional growth, school operations and recognition.</p></div>,
  <div className="presentation-slide" key="2"><h1>{avg}%</h1><h2>Average Development Performance</h2><p>Transparent metrics across attendance, observation, feedback, planning, training and achievement.</p></div>,
  <div className="presentation-slide" key="3"><Award size={58}/><h1>{(data.achievements||[]).length} Achievements</h1><p>Celebrate growth and teaching excellence with evidence-based recognition.</p><Link className="btn btn-primary" href="/achievement-wall">Open achievement wall</Link></div>,
 ]
 useEffect(()=>{const t=setInterval(()=>setSlide(x=>(x+1)%slides.length),7000);return()=>clearInterval(t)},[slides.length])
 if(loading)return <div className="loading">Preparing presentation…</div>
 return <div className="presentation-mode"><button className="btn no-print" onClick={()=>document.documentElement.requestFullscreen?.()}><Maximize2 size={15}/> Full screen</button>{slides[slide]}<div className="presentation-dots">{slides.map((_,i)=><button aria-label={`Slide ${i+1}`} className={slide===i?'active':''} key={i} onClick={()=>setSlide(i)}/>)}</div></div>
}