'use client'
import { Download } from 'lucide-react'
import { useData } from '@/components/DataProvider'
function csv(rows:any[]){if(!rows.length)return '';const keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`;return [keys.map(esc).join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n')}
export default function Exports(){
 const {data,loading}=useData();if(loading)return <div className="loading">Preparing exports…</div>
 const teachers=data.teachers_dashboard||[];const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))
 const sets=[['Teachers','teachers_dashboard'],['Attendance','attendance'],['Training','training'],['Feedback','feedback'],['Lesson Plans','lessons'],['Timetable','timetable_entries'],['Leave','leave_requests'],['Achievements','achievements'],['Goals','goals'],['Exam Duties','exam_responsibilities'],['Service History','teacher_service_history']]
 function rowsFor(key:string){return (data[key]||[]).map((r:any)=>{if(key==='teachers_dashboard')return r;if(r.teacher_id==null)return r;const t=teacher(r.teacher_id);return {teacher_code:t?.teacher_code||'',teacher_name:t?.name||'',...r}})}
 function download(label:string,key:string){const content='\ufeff'+csv(rowsFor(key));const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`teachtrack-${key}.csv`;a.click();URL.revokeObjectURL(url)}
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Data portability</span><h1 style={{marginTop:14}}>CSV / Excel exports</h1><p>Teacher-linked exports include Teacher Code and teacher name for easier school and ministry reporting.</p></div></div><div className="feature-grid">{sets.map(([label,key])=><article className="feature-card" key={key}><Download size={22}/><h3 style={{marginTop:10}}>{label}</h3><p>{(data[key]||[]).length} record(s) currently available.</p><button className="btn" style={{marginTop:12}} onClick={()=>download(label,key)}>Export CSV</button></article>)}</div></>
}
