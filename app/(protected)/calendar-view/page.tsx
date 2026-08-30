'use client'
import { useMemo,useState } from 'react'
import Link from 'next/link'
import { ChevronLeft,ChevronRight } from 'lucide-react'
import { useData } from '@/components/DataProvider'
export default function CalendarView(){
 const{data,loading}=useData();const[now,setNow]=useState(()=>new Date());const[mode,setMode]=useState<'month'|'week'>('month')
 const events=data.school_events||[],meetings=data.staff_meetings||[]
 const items=[...events.map((x:any)=>({date:String(x.start_at).slice(0,10),time:String(x.start_at).slice(11,16),title:x.title,type:x.event_type||'Event'})),...meetings.map((x:any)=>({date:String(x.meeting_at).slice(0,10),time:String(x.meeting_at).slice(11,16),title:x.title,type:'Meeting'}))]
 const first=new Date(now.getFullYear(),now.getMonth(),1),last=new Date(now.getFullYear(),now.getMonth()+1,0)
 const days=useMemo(()=>{if(mode==='week'){const start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})}const pad=(first.getDay()+6)%7;return Array.from({length:pad+last.getDate()},(_,i)=>i<pad?null:new Date(now.getFullYear(),now.getMonth(),i-pad+1))},[mode,now,first.getDay(),last.getDate()])
 if(loading)return <div className="loading">Building calendar…</div>
 function move(n:number){const d=new Date(now);if(mode==='month')d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+7*n);setNow(d)}
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Visual calendar</span><h1 style={{marginTop:14}}>School month / week view</h1><p>Training, observations, meetings and school events can be reviewed in a familiar calendar layout.</p></div><div className="toolbar"><button className="btn" onClick={()=>move(-1)}><ChevronLeft size={15}/></button><span className="status">{now.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'Asia/Colombo'})}</span><button className="btn" onClick={()=>move(1)}><ChevronRight size={15}/></button><div className="segmented"><button className={mode==='month'?'active':''} onClick={()=>setMode('month')}>Month</button><button className={mode==='week'?'active':''} onClick={()=>setMode('week')}>Week</button></div></div></div>
 <div className={`calendar-grid ${mode}`}>{days.map((d:any,i)=>{if(!d)return <div className="calendar-cell muted" key={`pad-${i}`}/>;const key=d.toISOString().slice(0,10),dayItems=items.filter(x=>x.date===key);return <div className="calendar-cell" key={key}><b>{d.getDate()}</b>{dayItems.slice(0,5).map((x:any,j)=><div className="calendar-chip" key={j}><strong>{x.time}</strong> {x.title}<small>{x.type}</small></div>)}{dayItems.length>5&&<small>+{dayItems.length-5} more</small>}</div>})}</div>
 <div className="toolbar" style={{marginTop:16}}><Link className="btn" href="/calendar">Manage events →</Link><Link className="btn" href="/meetings">Manage meetings →</Link></div></>
}