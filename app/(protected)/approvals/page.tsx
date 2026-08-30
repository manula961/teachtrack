'use client'
import { useState } from 'react'
import { Check,X,Plus,Workflow } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { createClient } from '@/lib/supabase/client'

export default function Approvals(){
 const {data,loading,role,insert,update,refresh}=useData();const[open,setOpen]=useState(false);const[workflowOpen,setWorkflowOpen]=useState(false);const[msg,setMsg]=useState('')
 const workflows=data.approval_workflows||[],requests=[...(data.approval_requests||[])].sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at))),actions=data.approval_actions||[]
 const workflow=(id:any)=>workflows.find((w:any)=>String(w.id)===String(id))
 const label=(r:string)=>r==='section_head'?'Section Head':r==='vice_principal'?'Vice Principal':r==='principal'?'Principal':r
 const canReview=['principal','vice_principal','section_head','reviewer'].includes(role);const leadership=['principal','vice_principal'].includes(role)

 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const wf=workflow(f.get('workflow_id'));try{await insert('approval_requests',{workflow_id:Number(f.get('workflow_id')),entity_type:wf?.entity_type||'general',entity_id:f.get('entity_id')?Number(f.get('entity_id')):null,title:String(f.get('title')),description:String(f.get('description')||''),current_step:0,status:'Pending'});setOpen(false);setMsg('Approval request submitted.')}catch(e:any){setMsg(e.message)}}

 async function createWorkflow(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const steps=String(f.get('steps')||'').split(',').map(x=>x.trim()).filter(Boolean);if(!steps.length)return setMsg('Add at least one workflow step.');try{await insert('approval_workflows',{name:String(f.get('name')),entity_type:String(f.get('entity_type')),steps,active:true});setWorkflowOpen(false);setMsg('Workflow template created.')}catch(e:any){setMsg(e.message)}}

 async function act(req:any,decision:'Approved'|'Rejected'){
  const wf=workflow(req.workflow_id),steps=Array.isArray(wf?.steps)?wf.steps:[];const expected=steps[req.current_step]
  if(role!=='principal'&&role!==expected){setMsg(`Current approval step requires ${label(expected||'an authorized reviewer')}.`);return}
  const comment=window.prompt(`${decision} comment (optional):`)||''
  try{
   const supabase=createClient()
   const ar=await supabase.from('approval_actions').insert({request_id:req.id,actor_role:role,action:decision,comment})
   if(ar.error)throw ar.error
   if(decision==='Rejected'){
    const rr=await supabase.from('approval_requests').update({status:'Rejected',completed_at:new Date().toISOString()}).eq('id',req.id);if(rr.error)throw rr.error
   }else{
    const next=req.current_step+1
    const finished=role==='principal'||next>=steps.length
    const rr=await supabase.from('approval_requests').update(finished?{status:'Approved',completed_at:new Date().toISOString()}:{current_step:next}).eq('id',req.id);if(rr.error)throw rr.error
   }
   await refresh();setMsg(decision==='Approved'?'Approval step completed.':'Request rejected.')
  }catch(e:any){setMsg(e.message)}
 }

 if(loading)return <div className="loading">Loading approval workflows…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Controlled school approvals</span><h1 style={{marginTop:14}}>Approval workflow engine</h1><p>Route lesson plans, leave, training and general school requests through configurable leadership approval steps.</p></div><div className="toolbar">{leadership&&<button className="btn" onClick={()=>setWorkflowOpen(true)}><Workflow size={16}/> New workflow</button>}<button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={16}/> New request</button></div></div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>WORKFLOW STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="grid-2"><section className="panel"><div className="panel-head"><div><h2>Workflow templates</h2><p>Active approval routes</p></div><Workflow/></div>{workflows.map((w:any)=><div className="queue-row" key={w.id}><div><b>{w.name}</b><small>{(w.steps||[]).map(label).join(' → ')}</small></div><span className="status good">{w.active?'Active':'Paused'}</span></div>)}</section>
 <section className="panel"><div className="panel-head"><div><h2>Approval summary</h2><p>Current request status</p></div></div>{[['Pending',requests.filter((r:any)=>r.status==='Pending').length],['Approved',requests.filter((r:any)=>r.status==='Approved').length],['Rejected',requests.filter((r:any)=>r.status==='Rejected').length],['Your role',label(role)]].map(x=><div className="metric" key={String(x[0])}><span>{x[0]}</span><b>{x[1]}</b></div>)}</section></div>
 <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h2>Approval queue</h2><p>Each request keeps an auditable action history.</p></div></div><div className="cms-queue">{requests.map((r:any)=>{const wf=workflow(r.workflow_id),steps=Array.isArray(wf?.steps)?wf.steps:[],expected=steps[r.current_step];const history=actions.filter((a:any)=>a.request_id===r.id);const canAct=r.status==='Pending'&&(role==='principal'||role===expected);return <div className="queue-row" key={r.id}><div><b>{r.title}</b><small>{wf?.name||r.entity_type} · {r.description||'No description'}</small><small>Linked record: {r.entity_type} #{r.entity_id||'—'} · Final decision synchronizes automatically.</small><small>{r.status==='Pending'?`Current step: ${label(expected||'Final review')}`:`Completed: ${r.status}`} · {history.length} action(s)</small></div><div className="toolbar"><span className={`status ${r.status==='Approved'?'good':''}`}>{r.status}</span>{canAct&&<><button className="btn" onClick={()=>act(r,'Approved')}><Check size={14}/> Approve</button><button className="btn" onClick={()=>act(r,'Rejected')}><X size={14}/> Reject</button></>}</div></div>})}</div>{!requests.length&&<div className="empty">No approval requests yet.</div>}</section>
 {workflowOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setWorkflowOpen(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="panel-head"><div><small>WORKFLOW DESIGNER</small><h2>Create approval route</h2></div><button className="btn" onClick={()=>setWorkflowOpen(false)}>Close</button></div><form onSubmit={createWorkflow} className="form-grid"><div className="field"><label>WORKFLOW NAME</label><input name="name" required placeholder="Resource Purchase Approval"/></div><div className="field"><label>ENTITY TYPE</label><input name="entity_type" required placeholder="purchase"/></div><div className="field full"><label>APPROVAL STEPS</label><input name="steps" required placeholder="section_head, vice_principal, principal"/><small>Use role IDs: section_head, vice_principal, principal.</small></div><button className="btn btn-primary full">Create workflow</button></form></div></div>}
 {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="panel-head"><div><small>NEW WORKFLOW REQUEST</small><h2>Submit for approval</h2></div><button className="btn" onClick={()=>setOpen(false)}>Close</button></div><form onSubmit={submit} className="form-grid"><div className="field full"><label>WORKFLOW</label><select name="workflow_id">{workflows.filter((w:any)=>w.active).map((w:any)=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div><div className="field"><label>TITLE</label><input name="title" required/></div><div className="field"><label>RELATED RECORD ID (OPTIONAL)</label><input name="entity_id" type="number"/></div><div className="field full"><label>DESCRIPTION</label><textarea name="description" rows={5}/></div><button className="btn btn-primary full">Submit request</button></form></div></div>}
 </>}
