'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'

export default function OrganizationPage(){
  const { data, loading, role, insert, remove } = useData()
  const leadership=['principal','vice_principal'].includes(role)
  const rows=data.school_org_units||[]
  const teachers=data.teachers_dashboard||[]
  const [open,setOpen]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  const teacherById=useMemo(
    ()=>new Map(teachers.map((t:any)=>[String(t.id),t])),
    [teachers]
  )
  const unitById=useMemo(
    ()=>new Map(rows.map((u:any)=>[String(u.id),u])),
    [rows]
  )

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const fd=new FormData(e.currentTarget)
    const leader=String(fd.get('leader_teacher_id')||'')
    const parent=String(fd.get('parent_id')||'')
    try{
      await insert('school_org_units',{
        name:String(fd.get('name')||'').trim(),
        unit_type:String(fd.get('unit_type')||'School'),
        parent_id:parent?Number(parent):null,
        leader_teacher_id:leader?Number(leader):null,
      })
      setOpen(false)
      setMessage('Organization unit created.')
    }catch(err:any){
      setMessage([err?.message,err?.details,err?.hint].filter(Boolean).join(' · ')||'Unable to create organization unit.')
    }finally{
      setBusy(false)
    }
  }

  if(loading)return <div className="loading">Loading organization structure…</div>

  return <>
    <div className="page-head">
      <div>
        <span className="eyebrow"><i className="dot"/>Leadership structure</span>
        <h1 style={{marginTop:14}}>School organization</h1>
        <p>Model sections, grades and departments beneath the school leadership hierarchy.</p>
      </div>
      {leadership&&<button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add unit</button>}
    </div>

    {message&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{message}</b></div><i className="pulse"/></div>}

    <section className="panel">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Unit</th><th>Type</th><th>Parent unit</th><th>Leader teacher / HOS</th>{leadership&&<th/>}</tr></thead>
          <tbody>
            {rows.map((r:any)=>{
              const parent=r.parent_id?unitById.get(String(r.parent_id)):null
              const teacher=r.leader_teacher_id?teacherById.get(String(r.leader_teacher_id)):null
              return <tr key={r.id}>
                <td><b>{r.name}</b></td>
                <td>{r.unit_type}</td>
                <td>{parent?.name||'—'}</td>
                <td>{teacher?<><b>{teacher.teacher_code||`ID ${teacher.id}`}</b><div style={{fontSize:12,opacity:.7}}>{teacher.name}</div></>:'—'}</td>
                {leadership&&<td><button className="btn" onClick={()=>remove('school_org_units',r.id)} title="Delete organization unit"><Trash2 size={14}/></button></td>}
              </tr>
            })}
          </tbody>
        </table>
        {!rows.length&&<div className="empty">No organization units yet.</div>}
      </div>
    </section>

    {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}>
      <div className="modal modal-form" role="dialog" aria-modal="true">
        <div className="panel-head">
          <div><small>LEADERSHIP STRUCTURE</small><h2>Add organization unit</h2></div>
          <button className="btn" onClick={()=>setOpen(false)}>Close</button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <div className="field"><label>UNIT NAME</label><input name="name" required placeholder="e.g. Grade 6 Section"/></div>
          <div className="field"><label>TYPE</label><select name="unit_type" required><option>School</option><option>Section</option><option>Grade</option><option>Department</option></select></div>
          <div className="field"><label>PARENT UNIT (OPTIONAL)</label><select name="parent_id"><option value="">No parent unit</option>{rows.map((r:any)=><option key={r.id} value={r.id}>{r.name} · {r.unit_type}</option>)}</select></div>
          <div className="field"><label>LEADER TEACHER / HOS</label><TeacherPicker name="leader_teacher_id" placeholder="Search teacher code, ID or name…"/></div>
          <button className="btn btn-primary full" disabled={busy}>{busy?'Saving…':'Create unit'}</button>
        </form>
      </div>
    </div>}
  </>
}
