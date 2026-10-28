'use client'
import { useState } from 'react'
import { Page, status } from '@/components/Page'
import { useData } from '@/components/DataProvider'

export default function Training() {
 const {data,role,update}=useData()
 const teachers=data.teachers_dashboard||[]
 const management=['principal','vice_principal'].includes(role)
 const [busy,setBusy]=useState<number|null>(null)
 const [message,setMessage]=useState('')
 const teacherName=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))?.name||'Teacher ID '+id
 const pending=(data.training||[]).filter((t:any)=>t.approval_status==='Pending')
 const completed=(data.training||[]).filter((t:any)=>t.approval_status==='Approved'&&t.status==='Completed'&&!t.certificate_verified)

 async function review(id:number,changes:Record<string,any>) {
  if(busy!==null)return
  setBusy(id);setMessage('')
  try{await update('training',id,changes);setMessage('Training verification record updated.')}
  catch(error:any){setMessage(error.message||'Could not update training.')}
  finally{setBusy(null)}
 }

 return <>
  <Page title="Training & certifications"
   subtitle="Professional development hours, providers, approvals and certificate status."
   table="training" adminOnlyCreate createLabel="Add training"
   columns={[
    {key:'teacher_id',label:'Teacher',render:r=>teacherName(r.teacher_id)},
    {key:'title',label:'Training'},
    {key:'provider',label:'Provider'},
    {key:'hours',label:'Hours'},
    {key:'status',label:'Training',render:r=>status(r.status)},
    {key:'approval_status',label:'Approval',render:r=>status(r.approval_status||'Pending')},
    {key:'certificate_verified',label:'Verified',render:r=>r.certificate_verified?'Yes':'No'},
    {key:'expiry_date',label:'Expires'}
   ]}
   fields={[
    {name:'teacher_id',label:'Teacher',type:'number',required:true},
    {name:'title',label:'Training title',required:true},
    {name:'provider',label:'Provider',required:true},
    {name:'date',label:'Date',type:'date',required:true},
    {name:'hours',label:'Hours',type:'number',required:true},
    {name:'status',label:'Status',options:['Completed','In Progress','Upcoming'],required:true},
    {name:'expiry_date',label:'Certificate expiry',type:'date'},
    {name:'certificate_url',label:'Certificate evidence URL',type:'url'}
   ]}
   transform={f=>({teacher_id:Number(f.get('teacher_id')),title:f.get('title'),
    provider:f.get('provider'),date:f.get('date'),hours:Number(f.get('hours')),
    status:f.get('status'),expiry_date:f.get('expiry_date')||null,
    certificate_url:f.get('certificate_url')||null,
    certificate_verified:false,approval_status:'Pending'})}
  />
  {management&&<section className="panel" style={{marginTop:18}}>
   <div className="panel-head"><div><h2>Training approval & certificate review</h2>
    <p>Approve course records first; only verify certificates with evidence.</p></div></div>
   {message&&<div className="command" role="status">{message}</div>}
   {pending.map((r:any)=><div className="queue-row" key={'pending-'+r.id}>
    <div><b>{r.title}</b><small>{teacherName(r.teacher_id)} · {r.provider} · {r.hours} hours</small></div>
    <div className="toolbar">
     <button className="btn btn-primary" disabled={busy!==null} onClick={()=>review(r.id,{approval_status:'Approved'})}>Approve</button>
     <button className="btn" disabled={busy!==null} onClick={()=>review(r.id,{approval_status:'Rejected',certificate_verified:false})}>Reject</button>
    </div>
   </div>)}
   {completed.map((r:any)=><div className="queue-row" key={'certificate-'+r.id}>
    <div><b>{r.title}</b><small>{teacherName(r.teacher_id)} · Certificate {r.certificate_url?'evidence URL recorded':'evidence missing'}</small></div>
    <button className="btn" disabled={busy!==null||!r.certificate_url}
     onClick={()=>review(r.id,{certificate_verified:true})}>Verify certificate</button>
   </div>)}
   {!pending.length&&!completed.length&&<div className="empty">No training approvals or certificate checks are pending.</div>}
  </section>}
 </>
}
