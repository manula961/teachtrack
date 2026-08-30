'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { CheckCircle2,Circle,X } from 'lucide-react'
const steps=[
 ['profile','Review your professional profile','/my-hub'],
 ['timetable','Check today’s timetable','/timetable'],
 ['goal','Create or review a development goal','/goals'],
 ['training','Record professional development','/training'],
 ['portfolio','Open your professional portfolio','/portfolio'],
]
export function OnboardingChecklist(){
 const[done,setDone]=useState<string[]>([]),[hidden,setHidden]=useState(false)
 useEffect(()=>{try{setDone(JSON.parse(localStorage.getItem('tt-onboarding')||'[]'));setHidden(localStorage.getItem('tt-onboarding-hidden')==='1')}catch{}},[])
 if(hidden)return null
 function toggle(k:string){const next=done.includes(k)?done.filter(x=>x!==k):[...done,k];setDone(next);localStorage.setItem('tt-onboarding',JSON.stringify(next))}
 return <section className="panel onboarding-panel"><div className="panel-head"><div><small>WELCOME CHECKLIST</small><h3>Get the most from TeachTrack</h3><p>{done.length}/{steps.length} completed · stored only in this browser</p></div><button className="icon-btn" title="Hide checklist" onClick={()=>{setHidden(true);localStorage.setItem('tt-onboarding-hidden','1')}}><X size={15}/></button></div>{steps.map(([k,label,href])=><div className="onboarding-row" key={k}><button onClick={()=>toggle(k)} aria-label={`Mark ${label} ${done.includes(k)?'incomplete':'complete'}`}>{done.includes(k)?<CheckCircle2 size={18}/>:<Circle size={18}/>}</button><Link href={href}>{label}</Link></div>)}</section>
}
