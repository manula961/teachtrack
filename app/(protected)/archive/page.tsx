'use client'
import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useData } from '@/components/DataProvider'
export default function ArchivePage(){
 const{data,loading,role,insert}=useData();const[year,setYear]=useState(new Date().getFullYear());const[msg,setMsg]=useState('');const leadership=['principal','vice_principal'].includes(role);const rows=data.school_archives||[]
 async function closeYear(){const summary={teachers:(data.teachers_dashboard||[]).length,attendance:(data.attendance||[]).length,training:(data.training||[]).length,lessons:(data.lessons||[]).length,observations:(data.observations||[]).length,achievements:(data.achievements||[]).length,timetable:(data.timetable_entries||[]).length,leave:(data.leave_requests||[]).length};try{await insert('school_archives',{academic_year:Number(year),title:`Academic Year ${year} Archive`,summary});setMsg('Academic-year snapshot archived. Export CSV copies as an additional external backup.')}catch(e:any){setMsg(e.message)}}
 if(loading)return <div className="loading">Loading archives…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Year closure & backup</span><h1 style={{marginTop:14}}>Academic archive</h1><p>Freeze a summary snapshot of an academic year while keeping current operational data separate.</p></div>{leadership&&<div className="toolbar"><input className="search" type="number" value={year} onChange={e=>setYear(Number(e.target.value))}/><button className="btn btn-primary" onClick={closeYear}><Archive size={16}/> Close & archive year</button></div>}</div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>ARCHIVE STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="feature-grid">{rows.map((r:any)=><article className="feature-card" key={r.id}><Archive size={22}/><h3 style={{marginTop:10}}>{r.title}</h3><p>Closed {new Date(r.closed_at).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})}</p><div className="metric"><span>Teachers</span><b>{r.summary?.teachers??'—'}</b></div><div className="metric"><span>Lesson records</span><b>{r.summary?.lessons??'—'}</b></div><div className="metric"><span>Observations</span><b>{r.summary?.observations??'—'}</b></div></article>)}</div>{!rows.length&&<div className="panel empty">No academic years archived yet.</div>}</>
}
