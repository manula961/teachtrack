'use client'
import { FormEvent,useState } from 'react'
import { Download,ExternalLink,HardDriveUpload,Paperclip,Trash2 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'
import { createClient } from '@/lib/supabase/client'

export default function Evidence(){
 const{data,loading,role,profile,refresh}=useData()
 const[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 const canReview=['principal','vice_principal','section_head','reviewer'].includes(role)
 const rows=(data.evidence_attachments||[]).filter((x:any)=>canReview||String(x.teacher_id)===String(profile?.teacher_id))

 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMsg('')
  const form=e.currentTarget
  const payload=new FormData(form)
  if(!canReview)payload.set('teacher_id',String(profile?.teacher_id||''))

  try{
   const response=await fetch('/api/evidence/google-drive',{method:'POST',body:payload})
   const body=await response.json().catch(()=>({}))
   if(!response.ok)throw new Error(body.error||'Evidence upload failed.')
   setMsg('Evidence uploaded securely to Google Drive and linked to TeachTrack.')
   form.reset()
   await refresh()
  }catch(err){
   setMsg(err instanceof Error?err.message:'Evidence upload failed.')
  }finally{
   setBusy(false)
  }
 }

 async function deleteEvidence(row:any){
  const title=String(row.title||'this evidence item')
  if(!window.confirm(`Delete “${title}”? This removes the Google Drive file and its TeachTrack evidence record.`))return
  setBusy(true);setMsg('')
  try{
   if(!(row.storage_provider==='google_drive'||row.drive_file_id))throw new Error('Legacy evidence must be removed from Document Vault/storage.')
   const response=await fetch(`/api/evidence/google-drive/${row.id}`,{method:'DELETE'})
   const body=await response.json().catch(()=>({}))
   if(!response.ok)throw new Error(body.error||'Evidence deletion failed.')
   setMsg('Evidence deleted from Google Drive and TeachTrack.')
   await refresh()
  }catch(err){
   setMsg(err instanceof Error?err.message:'Evidence deletion failed.')
  }finally{
   setBusy(false)
  }
 }

 async function openEvidence(row:any,download=false){
  if(row.storage_provider==='google_drive'||row.drive_file_id){
   window.open(`/api/evidence/google-drive/${row.id}${download?'?download=1':''}`,'_blank','noopener,noreferrer')
   return
  }

  // Backward compatibility for evidence uploaded before Google Drive was enabled.
  const path=String(row.storage_path||'')
  if(!path)return setMsg('This evidence record has no storage path.')
  const {data:d,error}=await createClient().storage.from('teacher-documents').createSignedUrl(path,60,{download:download?true:undefined})
  if(error)return setMsg(error.message)
  window.open(d.signedUrl,'_blank','noopener,noreferrer')
 }

 if(loading)return <div className="loading">Loading evidence…</div>

 return <>
  <div className="page-head">
   <div>
    <span className="eyebrow"><i className="dot"/>Evidence library</span>
    <h1 style={{marginTop:14}}>Evidence attachments</h1>
    <p>Store professional-development evidence privately in Google Drive while TeachTrack keeps the secure teacher and goal linkage.</p>
   </div>
   <span className="status good"><HardDriveUpload size={14}/> Google Drive storage</span>
  </div>

  {msg&&<div className="command"><div><b>{msg}</b></div><i className="pulse"/></div>}

  <div className="grid-2" style={{marginTop:18}}>
   <section className="panel">
    <div className="panel-head">
     <div><small>PRIVATE EVIDENCE STORAGE</small><h3>Upload evidence</h3><p>Files are uploaded server-side. Google credentials are never exposed to the browser.</p></div>
    </div>
    <form className="form-grid" onSubmit={submit}>
     {canReview&&<div className="field full"><label>TEACHER</label><TeacherPicker name="teacher_id" required/></div>}
     <div className="field"><label>LINK TO</label><select name="entity_type"><option>Goal</option><option>Observation</option><option>Achievement</option><option>Development Plan</option><option>Training</option><option>Other</option></select></div>
     <div className="field"><label>RECORD ID (OPTIONAL)</label><input name="entity_id" type="number" min="1"/></div>
     <div className="field full"><label>TITLE</label><input name="title" maxLength={180} required/></div>
     <div className="field full"><label>EVIDENCE FILE</label><input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx,.xlsx,.txt" required/><small>Maximum 20 MB · PDF, images, Office documents or text</small></div>
     <div className="field full"><label>NOTES</label><textarea name="notes" maxLength={4000}/></div>
     <button className="btn btn-primary full" disabled={busy}><Paperclip size={15}/>{busy?' Uploading to Google Drive…':' Upload evidence'}</button>
    </form>
   </section>

   <section className="panel">
    <div className="panel-head"><div><small>LINKED EVIDENCE</small><h3>Evidence library</h3><p>{rows.length} accessible item{rows.length===1?'':'s'}</p></div></div>
    {rows.map((x:any)=><div className="queue-row" key={x.id}>
     <div>
      <b>{x.title}</b>
      <small>{x.entity_type}{x.entity_id?` #${x.entity_id}`:''} · {x.file_type||'Evidence'} · {(x.storage_provider==='google_drive'||x.drive_file_id)?'Google Drive':'Legacy storage'}</small>
     </div>
     <div className="toolbar">
      <button className="btn" onClick={()=>openEvidence(x)}><ExternalLink size={14}/> Open</button>
      <button className="btn" onClick={()=>openEvidence(x,true)}><Download size={14}/> Download</button>
      {(x.storage_provider==='google_drive'||x.drive_file_id)&&<button className="btn" disabled={busy} onClick={()=>deleteEvidence(x)}><Trash2 size={14}/> Delete</button>}
     </div>
    </div>)}
    {!rows.length&&<div className="empty">No evidence attachments yet.</div>}
   </section>
  </div>
 </>
}
