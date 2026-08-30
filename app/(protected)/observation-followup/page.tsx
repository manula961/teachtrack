'use client'
import { FormEvent,useState } from 'react'
import { useData } from '@/components/DataProvider'
import { createClient } from '@/lib/supabase/client'
export default function ObservationFollowup(){
 const{data,loading,profile,role,insert,update}=useData();const[msg,setMsg]=useState('');const leadership=['principal','vice_principal','section_head','reviewer'].includes(role)
 const observations=(data.observations||[]).filter((o:any)=>leadership||String(o.teacher_id)===String(profile?.teacher_id))
 const rows=(data.observation_followups||[]).filter((x:any)=>observations.some((o:any)=>String(o.id)===String(x.observation_id)))
 async function add(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget),o=observations.find((x:any)=>String(x.id)===String(f.get('observation_id')));if(!o)return;try{await insert('observation_followups',{observation_id:Number(o.id),teacher_id:Number(o.teacher_id),recommendation:String(f.get('recommendation')),followup_date:String(f.get('followup_date')||'')||null,status:'Open'});setMsg('Follow-up created.')}catch(err:any){setMsg(err.message)}}
 async function createLinkedGoal(x:any){
  const due=new Date(Date.now()+90*86400000).toISOString().slice(0,10)
  const supabase=createClient()
  const r=await supabase.from('goals').insert({teacher_id:Number(x.teacher_id),title:`Observation follow-up: ${x.recommendation.slice(0,70)}`,category:'Observation',target_value:100,current_value:0,unit:'%',due_date:due,status:'Active'}).select('id').single()
  if(r.error)return setMsg(r.error.message)
  try{await update('observation_followups',x.id,{linked_goal_id:r.data.id,status:'Goal Created'});setMsg('Linked development goal created.')}catch(err:any){setMsg(err.message)}
 }
 if(loading)return <div className="loading">Loading observation follow-ups…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Observation workflow</span><h1 style={{marginTop:14}}>Observation follow-up</h1><p>Observation → recommendation → acknowledgement → goal → review → outcome.</p></div></div>{msg&&<div className="command"><div><b>{msg}</b></div><i className="pulse"/></div>}
 {leadership&&<section className="panel" style={{marginTop:18}}><form className="form-grid" onSubmit={add}><div className="field full"><label>OBSERVATION</label><select name="observation_id">{observations.map((o:any)=><option key={o.id} value={o.id}>{o.date} · {o.focus_area}</option>)}</select></div><div className="field full"><label>RECOMMENDATION</label><textarea name="recommendation" required/></div><div className="field"><label>FOLLOW-UP DATE</label><input name="followup_date" type="date"/></div><button className="btn btn-primary full">Create follow-up</button></form></section>}
 <section className="panel" style={{marginTop:18}}>{rows.map((x:any)=><div className="queue-row" key={x.id}><div><b>{x.recommendation}</b><small>{x.followup_date||'No follow-up date'} · {x.status}</small></div><div className="toolbar">{!x.acknowledged&&<button className="btn" onClick={()=>update('observation_followups',x.id,{acknowledged:true,status:'Acknowledged'})}>Acknowledge</button>}{leadership&&!x.linked_goal_id&&<button className="btn" onClick={()=>createLinkedGoal(x)}>Create linked goal</button>}{x.linked_goal_id&&<span className="status good">Goal #{x.linked_goal_id}</span>}{leadership&&x.status!=='Closed'&&<button className="btn btn-primary" onClick={()=>update('observation_followups',x.id,{status:'Closed',outcome:'Reviewed and closed'})}>Close</button>}</div></div>)}{!rows.length&&<div className="empty">No observation follow-ups.</div>}</section></>
}