'use client'
import { useState } from 'react'
import { Archive,Download,ExternalLink,FileText,RefreshCw,Trash2,Upload } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'
import { createClient } from '@/lib/supabase/client'
export default function Documents(){
 const{data,loading,role,profile,insert,update,remove}=useData();const[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[replacing,setReplacing]=useState<any|null>(null),[showArchived,setShowArchived]=useState(false)
 const leadership=['principal','vice_principal'].includes(role),teachers=data.teachers_dashboard||[],myId=profile?.teacher_id
 const rows=(data.teacher_documents||[]).filter((r:any)=>showArchived||!r.archived)
 const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))
 async function upload(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);const fd=new FormData(e.currentTarget),file=fd.get('file') as File,teacherId=replacing?Number(replacing.teacher_id):leadership?Number(fd.get('teacher_id')):Number(myId)
  if(!file?.size){setMsg('Choose a file.');setBusy(false);return}
  const supabase=createClient(),safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'),path=`${teacherId}/${Date.now()}-${safe}`
  const up=await supabase.storage.from('teacher-documents').upload(path,file,{upsert:false});if(up.error){setMsg(up.error.message);setBusy(false);return}
  let metadataSaved=false
  try{
   if(replacing){
    const old=String(replacing.storage_path||'')
    await update('teacher_documents',replacing.id,{storage_path:path,title:String(fd.get('title')||replacing.title),document_type:String(fd.get('document_type')||replacing.document_type),expiry_date:String(fd.get('expiry_date')||'')||null,version:Number(replacing.version||1)+1,archived:false})
    metadataSaved=true
    if(old){
     const removed=await supabase.storage.from('teacher-documents').remove([old])
     if(removed.error)setMsg(`Replacement saved, but the previous file could not be cleaned up: ${removed.error.message}`)
     else setMsg('Document replaced securely.')
    }else setMsg('Document replaced securely.')
   }else{
    await insert('teacher_documents',{teacher_id:teacherId,title:String(fd.get('title')),document_type:String(fd.get('document_type')),storage_path:path,expiry_date:String(fd.get('expiry_date')||'')||null,archived:false,version:1})
    metadataSaved=true
    setMsg('Document uploaded securely.')
   }
   setOpen(false);setReplacing(null)
  }catch(err:any){
   if(!metadataSaved)await supabase.storage.from('teacher-documents').remove([path]).catch(()=>undefined)
   setMsg(err.message)
  }
  setBusy(false)
 }
 async function signed(path:string,download=false){
  const s=createClient(),{data,error}=await s.storage.from('teacher-documents').createSignedUrl(path,60,{download:download?true:undefined});if(error)return setMsg(error.message)
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
 }
 async function deleteDoc(r:any){
  if(!window.confirm(`Delete ${r.title}? This removes the private storage object and database record.`))return
  const s=createClient(),original=String(r.storage_path||'')
  const fileName=original.split('/').pop()||`document-${r.id}`
  const trashPath=original?`${r.teacher_id}/.trash/${Date.now()}-${fileName}`:''
  let moved=false
  try{
   if(original){
    const moveResult=await s.storage.from('teacher-documents').move(original,trashPath)
    if(moveResult.error)throw moveResult.error
    moved=true
   }

   try{
    await remove('teacher_documents',r.id)
   }catch(dbError){
    if(moved){
     const restore=await s.storage.from('teacher-documents').move(trashPath,original)
     if(restore.error)throw new Error(`Database delete failed and file restore also failed: ${restore.error.message}`)
    }
    throw dbError
   }

   if(moved){
    const purge=await s.storage.from('teacher-documents').remove([trashPath])
    if(purge.error){
     setMsg(`Document record deleted. A private trash copy could not be purged automatically: ${purge.error.message}`)
     return
    }
   }
   setMsg('Document deleted.')
  }catch(err:any){setMsg(`Delete could not be completed safely: ${err.message}`)}
 }
 if(loading)return <div className="loading">Loading secure documents…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Private document vault</span><h1 style={{marginTop:14}}>Teacher documents</h1><p>Preview, download, replace, archive and manage qualifications, certificates and professional evidence in private Supabase Storage.</p></div><div className="toolbar"><label className="status"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Show archived</label><button className="btn btn-primary" onClick={()=>{setReplacing(null);setOpen(true)}}><Upload size={16}/> Upload document</button></div></div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="feature-grid">{rows.map((r:any)=><article className={`feature-card ${r.archived?'archived-card':''}`} key={r.id}><FileText size={22}/><h3 style={{marginTop:10}}>{r.title}</h3><p>{r.document_type} · {teacher(r.teacher_id)?.name||'My document'} · v{r.version||1}</p><div className="metric"><span>Expiry</span><b>{r.expiry_date||'No expiry'}</b></div><div className="toolbar" style={{marginTop:12}}><button className="btn" onClick={()=>signed(r.storage_path)}><ExternalLink size={14}/> Preview</button><button className="btn" onClick={()=>signed(r.storage_path,true)}><Download size={14}/> Download</button><button className="btn" onClick={()=>{setReplacing(r);setOpen(true)}}><RefreshCw size={14}/> Replace</button><button className="btn" onClick={()=>update('teacher_documents',r.id,{archived:!r.archived})}><Archive size={14}/> {r.archived?'Restore':'Archive'}</button>{leadership&&<button className="btn" onClick={()=>deleteDoc(r)}><Trash2 size={14}/></button>}</div></article>)}</div>{!rows.length&&<div className="panel empty">No documents in this view.</div>}
 {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target){setOpen(false);setReplacing(null)}}}><div className="modal modal-form" role="dialog" aria-modal="true"><div className="panel-head"><div><small>PRIVATE STORAGE</small><h2>{replacing?'Replace document':'Upload teacher document'}</h2><p>{replacing?'The old storage object is removed after the replacement metadata is saved.':'Private Supabase Storage'}</p></div><button className="btn" onClick={()=>{setOpen(false);setReplacing(null)}}>Close</button></div><form onSubmit={upload} className="form-grid">
 {!replacing&&leadership&&<div className="field full"><label>TEACHER</label><TeacherPicker name="teacher_id" required placeholder="Search teacher code, ID or name…"/></div>}<div className="field"><label>TITLE</label><input name="title" required defaultValue={replacing?.title||''}/></div><div className="field"><label>TYPE</label><select name="document_type" defaultValue={replacing?.document_type||'Qualification'}><option>Qualification</option><option>Appointment</option><option>Training Certificate</option><option>Service Record</option><option>Other</option></select></div><div className="field"><label>EXPIRY DATE</label><input type="date" name="expiry_date" defaultValue={replacing?.expiry_date||''}/></div><div className="field"><label>{replacing?'REPLACEMENT FILE':'FILE'}</label><input type="file" name="file" required/></div><button className="btn btn-primary full" disabled={busy}>{busy?'Uploading…':replacing?'Replace securely':'Upload securely'}</button></form></div></div>}
 </>}
