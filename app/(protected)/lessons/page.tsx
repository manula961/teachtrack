'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useData } from '@/components/DataProvider'
import { status } from '@/components/Page'
import { TeacherPicker } from '@/components/TeacherPicker'
import { createClient } from '@/lib/supabase/client'

export default function Lessons(){
 const {loading,data,role,profile,insert,update,refresh}=useData()
 const [open,setOpen]=useState(false)
 const [editing,setEditing]=useState<any|null>(null)
 const [saving,setSaving]=useState(false)
 const [saveError,setSaveError]=useState('')
 const [message,setMessage]=useState('')
 const teachers=data.teachers_dashboard||[]
 const rows=data.lessons||[]
 const leadership=['principal','vice_principal'].includes(role)
 const canCreate=leadership||(role==='teacher'&&Boolean(profile?.teacher_id))
 const canEdit=(r:any)=>r.status==='Draft'&&(leadership||String(r.teacher_id)===String(profile?.teacher_id))
 const teacherName=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))?.name||'Teacher ID '+id

 function openNew(){setEditing(null);setSaveError('');setOpen(true)}
 function editDraft(r:any){setEditing(r);setSaveError('');setOpen(true)}
 function close(){if(saving)return;setOpen(false);setEditing(null)}

 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(saving)return
  const f=new FormData(e.currentTarget)
  const payload={title:String(f.get('title')||''),subject:String(f.get('subject')||''),
   grade:String(f.get('grade')||''),date:String(f.get('date')||''),objective:String(f.get('objective')||'')}
  setSaving(true);setSaveError('')
  try{
   if(editing){
    await update('lessons',editing.id,payload)
    setMessage('Lesson draft updated.')
   }else{
    const teacherId=leadership?Number(f.get('teacher_id')):Number(profile?.teacher_id)
    if(!teacherId)throw new Error('Select a teacher to create this lesson.')
    await insert('lessons',{...payload,teacher_id:teacherId,status:String(f.get('status')||'Draft')})
    setMessage('Lesson plan created.')
   }
   closeAfterSave()
  }catch(error:any){setSaveError(error.message||'Could not save lesson plan.')}
  finally{setSaving(false)}
 }

 function closeAfterSave(){setOpen(false);setEditing(null)}

 async function submitDraft(r:any){
  if(saving)return
  setSaving(true);setMessage('')
  try{
   const {error}=await createClient().rpc('submit_lesson_plan',{p_lesson_id:Number(r.id)})
   if(error)throw error
   await refresh();setMessage('Lesson submitted to the configured approval workflow.')
  }catch(error:any){setMessage(error.message||'Could not submit lesson plan.')}
  finally{setSaving(false)}
 }
 if(loading)return <div className="loading">Loading lesson plans…</div>
 return <>
  <div className="page-head">
   <div><span className="eyebrow"><i className="dot"/>Planning workflow</span>
    <h1>Lesson plans</h1>
    <p>Create and edit drafts, submit for formal review and see decisions.</p></div>
   {canCreate&&<button className="btn btn-primary" onClick={openNew}>+ New lesson plan</button>}
  </div>
  {message&&<div className="command" role="status">{message}</div>}
  <section className="panel">
   <div className="panel-head"><div><h3>Lesson plan workflow</h3>
    <p>{rows.length} plan(s) in the secure database</p></div>
    <Link className="btn" href="/approvals">Approval workflows</Link>
   </div>
   <div className="table-wrap">
    <table className="table"><thead><tr>
     <th>Teacher</th><th>Title</th><th>Subject</th><th>Grade</th><th>Date</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}>
     <td>{teacherName(r.teacher_id)}</td><td>{r.title}</td><td>{r.subject}</td>
     <td>{r.grade}</td><td>{r.date}</td><td>{status(r.status)}</td>
     <td>{canEdit(r)&&<div className="toolbar">
      <button className="btn" onClick={()=>editDraft(r)} disabled={saving}>Edit draft</button>
      <button className="btn btn-primary" onClick={()=>submitDraft(r)} disabled={saving}>Submit for review</button>
     </div>}{r.status==='Pending'&&<span className="status">Awaiting review</span>}</td>
    </tr>)}</tbody></table>
    {!rows.length&&<div className="empty">No lesson plans yet.</div>}
   </div>
  </section>
  {open&&<div className="modal-backdrop">
   <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lesson-editor-title">
    <div className="panel-head"><div><h2 id="lesson-editor-title">{editing?'Edit lesson draft':'New lesson plan'}</h2>
     <p>{editing?'Make changes before submitting the draft.':'Save a draft or submit for approval.'}</p></div>
     <button className="btn" onClick={close} disabled={saving}>Close</button>
    </div>
    <form className="form-grid" onSubmit={submit}>
     {leadership&&!editing&&<div className="field full">
      <TeacherPicker name="teacher_id" label="TEACHER" required allowEmpty={false} placeholder="Select teacher…"/>
     </div>}
     {editing&&<div className="field full"><label>TEACHER</label><p>{teacherName(editing.teacher_id)}</p></div>}
     {!editing&&<div className="field"><label>STATUS</label><select name="status">
      <option>Draft</option><option>Pending</option></select></div>}
     <div className="field full"><label>TITLE</label><input name="title" defaultValue={editing?.title||''} required/></div>
     <div className="field"><label>SUBJECT</label><input name="subject" defaultValue={editing?.subject||''} required/></div>
     <div className="field"><label>GRADE</label><input name="grade" defaultValue={editing?.grade||''} required/></div>
     <div className="field"><label>DATE</label><input name="date" type="date" defaultValue={editing?.date||''} required/></div>
     <div className="field full"><label>LEARNING OBJECTIVE</label><textarea name="objective" defaultValue={editing?.objective||''} required/></div>
     {saveError&&<div className="error full" role="alert">{saveError}</div>}
     <button className="btn btn-primary full" disabled={saving}>{saving?'Saving…':editing?'Save draft changes':'Save lesson plan'}</button>
    </form>
   </div>
  </div>}
 </>
}
