'use client'
import { useData } from '@/components/DataProvider'
export default function MeetingActions(){
 const{data,loading,update}=useData();if(loading)return <div className="loading">Loading meeting actions…</div>
 const teachers=data.teachers_dashboard||[],meetings=data.staff_meetings||[]
 const rows=[...(data.meeting_actions||[])].sort((a:any,b:any)=>String(a.due_date||'9999').localeCompare(String(b.due_date||'9999')))
 const today=new Date().toISOString().slice(0,10)
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Accountability</span><h1 style={{marginTop:14}}>Meeting action tracker</h1><p>Assignee, due date, status and overdue controls in one place.</p></div></div><section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Action</th><th>Meeting</th><th>Assignee</th><th>Due</th><th>Status</th><th>Update</th></tr></thead><tbody>{rows.map((a:any)=><tr key={a.id}><td><b>{a.action}</b></td><td>{meetings.find((m:any)=>String(m.id)===String(a.meeting_id))?.title||'—'}</td><td>{teachers.find((t:any)=>String(t.id)===String(a.teacher_id))?.name||'Unassigned'}</td><td><span className={a.due_date&&a.due_date<today&&a.status!=='Done'?'priority-high':''}>{a.due_date||'Open'}</span></td><td>{a.status}</td><td><select value={a.status} onChange={e=>update('meeting_actions',a.id,{status:e.target.value})}><option>Open</option><option>In Progress</option><option>Done</option></select></td></tr>)}</tbody></table></div></section></>
}