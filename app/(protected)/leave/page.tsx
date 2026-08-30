'use client'
import { useMemo,useState } from 'react'
import { Plus,Search } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'

const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
export default function LeavePage(){
 const {data,loading,role,profile,insert}=useData();const[open,setOpen]=useState(false);const[selected,setSelected]=useState<any>(null);const[msg,setMsg]=useState('')
 const leadership=['principal','vice_principal'].includes(role);const teachers=data.teachers_dashboard||[];const leaves=data.leave_requests||[];const entries=data.timetable_entries||[];const periods=data.school_periods||[]
 const myId=profile?.teacher_id
 const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))
 const affected=useMemo(()=>{if(!selected)return[];const start=new Date(selected.start_date+'T00:00:00'),end=new Date(selected.end_date+'T00:00:00');const out:any[]=[]
  for(let dt=new Date(start);dt<=end;dt.setDate(dt.getDate()+1)){const dow=dt.getDay();if(dow>=1&&dow<=5){for(const e of entries.filter((x:any)=>String(x.teacher_id)===String(selected.teacher_id)&&Number(x.day_of_week)===dow)){out.push({...e,date:new Date(dt).toISOString().slice(0,10)})}}}return out},[selected,entries])
 function freeTeachers(item:any){
  const day=new Date(item.date+'T00:00:00').getDay()
  return teachers.filter((t:any)=>String(t.id)!==String(item.teacher_id)&&!entries.some((e:any)=>String(e.teacher_id)===String(t.id)&&Number(e.day_of_week)===day&&Number(e.period_id)===Number(item.period_id)))
   .map((t:any)=>{const weekly=entries.filter((e:any)=>String(e.teacher_id)===String(t.id)).length;const subjectMatch=String(t.subject||'').toLowerCase()===String(item.subject||'').toLowerCase();const score=(subjectMatch?50:0)+Math.max(0,40-weekly);return {...t,coverScore:score,weekly,subjectMatch}})
   .sort((a:any,b:any)=>b.coverScore-a.coverScore)
 }
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);try{await insert('leave_requests',{teacher_id:leadership?Number(fd.get('teacher_id')):Number(myId),leave_type:String(fd.get('leave_type')),start_date:String(fd.get('start_date')),end_date:String(fd.get('end_date')),reason:String(fd.get('reason')||'')});setOpen(false);setMsg('Leave request submitted and routed to Approval Workflows.')}catch(err:any){setMsg(err.message)}}
 async function assignSub(item:any,substituteId:number){try{await insert('timetable_substitutions',{timetable_entry_id:Number(item.id),date:item.date,original_teacher_id:Number(item.teacher_id),substitute_teacher_id:Number(substituteId),reason:`Cover for approved leave #${selected?.id||''}`,status:'Assigned'});setMsg(`Substitute assigned for ${item.date}.`)}catch(err:any){setMsg(err.message)}}
 if(loading)return <div className="loading">Loading leave management…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Leave & cover</span><h1 style={{marginTop:14}}>Teacher leave management</h1><p>Request leave, approve absences and instantly identify timetable periods that need cover.</p></div><button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={16}/> Request leave</button></div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th>Type</th><th>Dates</th><th>Status</th><th>Reason</th><th>Cover</th>{leadership&&<th>Approval</th>}</tr></thead><tbody>
 {leaves.map((l:any)=><tr key={l.id}><td>{teacher(l.teacher_id)?.name||'Teacher'}</td><td>{l.leave_type}</td><td>{l.start_date} → {l.end_date}</td><td><span className={`status ${l.status==='Approved'?'good':''}`}>{l.status}</span></td><td>{l.reason||'—'}</td><td><button className="btn" onClick={()=>setSelected(l)}><Search size={14}/> Find cover</button></td>{leadership&&<td><span className="status">Use Approval Workflows</span></td>}</tr>)}
 </tbody></table>{!leaves.length&&<div className="empty">No leave requests yet.</div>}</div></section>
 {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setSelected(null)}}><div className="modal" role="dialog" aria-modal="true"><div className="panel-head"><div><small>SMART SUBSTITUTE FINDER</small><h2>{teacher(selected.teacher_id)?.name}</h2><p>{affected.length} timetable period(s) affected by this leave.</p></div><button className="btn" onClick={()=>setSelected(null)}>Close</button></div>
 {affected.length?affected.map((a:any)=>{const p=periods.find((x:any)=>x.id===a.period_id);const free=freeTeachers(a);return <div className="queue-row" key={`${a.date}-${a.id}`}><div><b>{a.date} · {DAYS[new Date(a.date+'T00:00:00').getDay()]} · {p?.label}</b><small>{a.subject} · Ranked by subject match + current workload: {free.slice(0,4).map((t:any)=>`${t.name}${t.subjectMatch?' ★':''}`).join(', ')||'None available'}</small></div><div className="toolbar"><span className={`status ${free.length?'good':''}`}>{free.length} available</span>{leadership&&free.slice(0,4).map((t:any,i:number)=><button className={i===0?'btn btn-primary':'btn'} key={t.id} onClick={()=>assignSub(a,t.id)}>#{i+1} {t.name}{t.subjectMatch?' ★':''}</button>)}</div></div>}):<div className="empty">No teaching periods are affected.</div>}</div></div>}
 {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="panel-head"><div><small>LEAVE REQUEST</small><h2>New request</h2></div><button className="btn" onClick={()=>setOpen(false)}>Close</button></div><form onSubmit={submit} className="form-grid">
 {leadership&&<div className="field full"><label>TEACHER</label><TeacherPicker name="teacher_id" required={false} allowEmpty={true} placeholder="Search teacher code, ID or name…"/></div>}
 <div className="field"><label>LEAVE TYPE</label><select name="leave_type"><option>Casual</option><option>Medical</option><option>Duty</option><option>Personal</option><option>Other</option></select></div><div/>
 <div className="field"><label>FROM</label><input name="start_date" type="date" required/></div><div className="field"><label>TO</label><input name="end_date" type="date" required/></div>
 <div className="field full"><label>REASON</label><textarea name="reason" rows={4}/></div><button className="btn btn-primary full">Submit request</button></form></div></div>}
 </>}
