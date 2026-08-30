'use client'
import Link from 'next/link'

import { useMemo, useState } from 'react'
import { Plus, Trash2, CalendarDays, Users, School, AlertTriangle, Repeat2 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'
import { createClient } from '@/lib/supabase/client'

const DAYS = [
  { id:1, label:'Monday' },
  { id:2, label:'Tuesday' },
  { id:3, label:'Wednesday' },
  { id:4, label:'Thursday' },
  { id:5, label:'Friday' },
]

type Row=Record<string,any>

function time(v:string){
  if(!v) return ''
  return String(v).slice(0,5)
}

export default function TimetablePage(){
  const { data, loading, role, profile, refresh, insert, remove } = useData()
  const [mode,setMode]=useState<'teacher'|'class'>('teacher')
  const [selectedTeacher,setSelectedTeacher]=useState('')
  const [selectedClass,setSelectedClass]=useState('')
  const [showEntry,setShowEntry]=useState(false)
  const [showClass,setShowClass]=useState(false)
  const [showSub,setShowSub]=useState(false)
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)

  const periods=(data.school_periods||[]).slice().sort((a,b)=>a.sort_order-b.sort_order)
  const teachers=data.teachers_dashboard||[]
  const classes=data.timetable_classes||[]
  const entries=data.timetable_entries||[]
  const substitutions=data.timetable_substitutions||[]
  const leadership=['principal','vice_principal'].includes(role)
  const myTeacherId=profile?.teacher_id ? String(profile.teacher_id) : ''

  const activeTeacherId=selectedTeacher || (leadership ? String(teachers[0]?.id||'') : myTeacherId)
  const activeClassId=selectedClass || String(classes[0]?.id||'')

  const visibleEntries=useMemo(()=>{
    if(mode==='teacher') return entries.filter((e:Row)=>String(e.teacher_id)===activeTeacherId)
    return entries.filter((e:Row)=>String(e.class_id)===activeClassId)
  },[entries,mode,activeTeacherId,activeClassId])

  const teacherById=(id:any)=>teachers.find((t:Row)=>String(t.id)===String(id))
  const classById=(id:any)=>classes.find((c:Row)=>String(c.id)===String(id))
  const entryAt=(day:number,period:number)=>visibleEntries.find((e:Row)=>Number(e.day_of_week)===day&&Number(e.period_id)===period)

  const freeCount=periods.filter((p:Row)=>!p.is_interval).reduce((n,p:Row)=>
    n + DAYS.filter(d=>!entryAt(d.id,p.id)).length,0)

  async function addEntry(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('')
    const fd=new FormData(e.currentTarget)
    try{
      await insert('timetable_entries',{
        class_id:Number(fd.get('class_id')),
        teacher_id:Number(fd.get('teacher_id')),
        day_of_week:Number(fd.get('day_of_week')),
        period_id:Number(fd.get('period_id')),
        subject:String(fd.get('subject')||'').trim(),
        room:String(fd.get('room')||'').trim(),
        notes:String(fd.get('notes')||'').trim(),
      })
      setShowEntry(false);setMessage('Lesson added to the timetable.')
    }catch(err:any){setMessage(err?.message||'Unable to add lesson.')}
    setBusy(false)
  }

  async function addClass(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('')
    const fd=new FormData(e.currentTarget)
    try{
      await insert('timetable_classes',{
        name:String(fd.get('name')||'').trim(),
        grade:String(fd.get('grade')||'').trim(),
        section:String(fd.get('section')||'').trim(),
        medium:String(fd.get('medium')||'English'),
        class_teacher_id:fd.get('class_teacher_id')?Number(fd.get('class_teacher_id')):null,
        room:String(fd.get('room')||'').trim(),
      })
      setShowClass(false);setMessage('Class created.')
    }catch(err:any){setMessage(err?.message||'Unable to create class.')}
    setBusy(false)
  }

  async function addSub(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('')
    const fd=new FormData(e.currentTarget)
    const entryId=Number(fd.get('timetable_entry_id'))
    const entry=entries.find((x:Row)=>Number(x.id)===entryId)
    try{
      await insert('timetable_substitutions',{
        timetable_entry_id:entryId,
        date:String(fd.get('date')),
        original_teacher_id:Number(entry?.teacher_id),
        substitute_teacher_id:Number(fd.get('substitute_teacher_id')),
        reason:String(fd.get('reason')||'').trim(),
        status:'Assigned'
      })
      setShowSub(false);setMessage('Substitute teacher assigned.')
    }catch(err:any){setMessage(err?.message||'Unable to assign substitute.')}
    setBusy(false)
  }

  async function deleteEntry(id:number){
    if(!confirm('Remove this lesson from the timetable?'))return
    try{await remove('timetable_entries',id);setMessage('Lesson removed.')}
    catch(err:any){setMessage(err?.message||'Unable to remove lesson.')}
  }

  if(loading)return <div className="loading">Loading timetable…</div>

  return <>
    <div className="page-head">
      <div>
        <span className="eyebrow"><i className="dot"/>School timetable</span>
        <h1 style={{marginTop:14}}>Weekly timetable</h1>
        <p>8 teaching periods, Monday to Friday, with the 10:30–10:50 interval protected from scheduling.</p>
      </div>
      {leadership&&<div className="toolbar"><Link className="btn" href="/timetable-generator">Generate class timetable</Link>
        <button className="btn" onClick={()=>setShowClass(true)}><School size={16}/> New class</button>
        <button className="btn" onClick={()=>setShowSub(true)}><Repeat2 size={16}/> Substitute</button>
        <button className="btn btn-primary" onClick={()=>setShowEntry(true)}><Plus size={16}/> Add lesson</button>
      </div>}
    </div>

    {message&&<div className="command timetable-message"><div><small>STATUS</small><b>{message}</b></div><i className="pulse"/></div>}

    <section className="kpis timetable-kpis">
      <div className="kpi"><small>TEACHING PERIODS</small><b>8</b><span>40 minutes each</span></div>
      <div className="kpi"><small>SCHOOL WEEK</small><b>5</b><span>Monday–Friday</span></div>
      <div className="kpi"><small>INTERVAL</small><b>20m</b><span>10:30–10:50</span></div>
      <div className="kpi"><small>{mode==='teacher'?'FREE SLOTS':'UNASSIGNED SLOTS'}</small><b>{freeCount}</b><span>In current view</span></div>
    </section>

    <section className="panel">
      <div className="panel-head timetable-toolbar">
        <div>
          <small>VIEW MODE</small>
          <div className="segmented">
            <button className={mode==='teacher'?'active':''} onClick={()=>setMode('teacher')}><Users size={15}/> Teacher</button>
            {leadership&&<button className={mode==='class'?'active':''} onClick={()=>setMode('class')}><School size={15}/> Class</button>}
          </div>
        </div>
        <div className="timetable-selectors">
          {mode==='teacher'&&leadership&&<label><span>Teacher</span><select value={activeTeacherId} onChange={e=>setSelectedTeacher(e.target.value)}>
            {teachers.map((t:Row)=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>}
          {mode==='teacher'&&!leadership&&<div className="status good">{teacherById(activeTeacherId)?.name||profile?.full_name||'My timetable'}</div>}
          {mode==='class'&&<label><span>Class</span><select value={activeClassId} onChange={e=>setSelectedClass(e.target.value)}>
            {classes.map((c:Row)=><option key={c.id} value={c.id}>{c.name} · {c.medium}</option>)}
          </select></label>}
        </div>
      </div>

      {!classes.length&&leadership ? <div className="empty">
        <School size={34}/><h3>No classes yet</h3><p>Create your first class, then start assigning lessons.</p>
        <button className="btn btn-primary" onClick={()=>setShowClass(true)}>Create class</button>
      </div> : (
      <div className="timetable-scroll">
        <div className="timetable-grid" style={{gridTemplateColumns:`150px repeat(${DAYS.length}, minmax(155px,1fr))`}}>
          <div className="tt-corner">Period</div>
          {DAYS.map(d=><div className="tt-day" key={d.id}>{d.label}</div>)}
          {periods.map((p:Row)=>[
            <div className={`tt-time ${p.is_interval?'interval':''}`} key={`time-${p.id}`}>
              <b>{p.label}</b><span>{time(p.start_time)}–{time(p.end_time)}</span>
            </div>,
            ...DAYS.map(d=>{
              if(p.is_interval)return <div className="tt-cell interval" key={`${d.id}-${p.id}`}><span>INTERVAL</span></div>
              const item=entryAt(d.id,p.id)
              if(!item)return <div className="tt-cell empty-slot" key={`${d.id}-${p.id}`}>{leadership&&<button onClick={()=>setShowEntry(true)}>+</button>}</div>
              const teacher=teacherById(item.teacher_id)
              const cls=classById(item.class_id)
              return <div className="tt-cell lesson" key={`${d.id}-${p.id}`}>
                <div className="tt-subject">{item.subject}</div>
                <div className="tt-meta">{mode==='teacher' ? (cls?.name||'Class') : (teacher?.name||'Teacher')}</div>
                {item.room&&<div className="tt-room">{item.room}</div>}
                {leadership&&<button className="tt-delete" title="Remove lesson" onClick={()=>deleteEntry(item.id)}><Trash2 size={13}/></button>}
              </div>
            })
          ])}
        </div>
      </div>)}
    </section>

    {substitutions.length>0&&<section className="panel" style={{marginTop:18}}>
      <div className="panel-head"><div><small>SUBSTITUTIONS</small><h2>Recent assignments</h2><p>Temporary teacher cover recorded in Supabase.</p></div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Lesson</th><th>Original</th><th>Substitute</th><th>Status</th></tr></thead>
      <tbody>{substitutions.slice(0,10).map((s:Row)=>{
        const ent=entries.find((e:Row)=>e.id===s.timetable_entry_id)
        return <tr key={s.id}><td>{s.date}</td><td>{ent?.subject||'Lesson'}</td><td>{teacherById(s.original_teacher_id)?.name||'—'}</td><td>{teacherById(s.substitute_teacher_id)?.name||'—'}</td><td><span className="status good">{s.status}</span></td></tr>
      })}</tbody></table></div>
    </section>}

    {showEntry&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setShowEntry(false)}}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="panel-head"><div><small>TIMETABLE</small><h2>Add lesson</h2><p>Database clash detection checks teacher, class and room availability.</p></div><button className="btn" onClick={()=>setShowEntry(false)}>Close</button></div>
        <form onSubmit={addEntry} className="form-grid">
          <div className="field"><label>CLASS</label><select name="class_id" required>{classes.map((c:Row)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>TEACHER</label><TeacherPicker name="teacher_id" required={true} allowEmpty={false} placeholder="Search teacher code, ID or name…"/></div>
          <div className="field"><label>DAY</label><select name="day_of_week" required>{DAYS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
          <div className="field"><label>PERIOD</label><select name="period_id" required>{periods.filter((p:Row)=>!p.is_interval).map((p:Row)=><option key={p.id} value={p.id}>{p.label} · {time(p.start_time)}–{time(p.end_time)}</option>)}</select></div>
          <div className="field"><label>SUBJECT</label><input name="subject" required placeholder="Mathematics"/></div>
          <div className="field"><label>ROOM</label><input name="room" placeholder="Room 12 / Science Lab"/></div>
          <div className="field full"><label>NOTES</label><textarea name="notes" rows={3} placeholder="Optional lesson note"/></div>
          <button className="btn btn-primary full" disabled={busy}>{busy?'Saving…':'Add to timetable'}</button>
        </form>
      </div>
    </div>}

    {showClass&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setShowClass(false)}}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="panel-head"><div><small>CLASS SETUP</small><h2>Create class</h2><p>Add a Sri Lankan school class or section.</p></div><button className="btn" onClick={()=>setShowClass(false)}>Close</button></div>
        <form onSubmit={addClass} className="form-grid">
          <div className="field"><label>CLASS NAME</label><input name="name" required placeholder="10-A"/></div>
          <div className="field"><label>GRADE</label><select name="grade" required>{Array.from({length:13},(_,i)=>i+1).map(g=><option key={g} value={`Grade ${g}`}>Grade {g}</option>)}</select></div>
          <div className="field"><label>SECTION</label><input name="section" placeholder="Junior Secondary"/></div>
          <div className="field"><label>MEDIUM</label><select name="medium"><option>English</option><option>Sinhala</option><option>Tamil</option></select></div>
          <div className="field"><label>CLASS TEACHER</label><TeacherPicker name="class_teacher_id" required={false} allowEmpty={true} placeholder="Search class teacher code, ID or name…"/></div>
          <div className="field"><label>HOME ROOM</label><input name="room" placeholder="Block A · Room 4"/></div>
          <button className="btn btn-primary full" disabled={busy}>{busy?'Creating…':'Create class'}</button>
        </form>
      </div>
    </div>}

    {showSub&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setShowSub(false)}}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="panel-head"><div><small>COVER</small><h2>Assign substitute</h2><p>The database checks that the substitute is free during the selected lesson.</p></div><button className="btn" onClick={()=>setShowSub(false)}>Close</button></div>
        <form onSubmit={addSub} className="form-grid">
          <div className="field full"><label>LESSON</label><select name="timetable_entry_id" required>{entries.map((e:Row)=>{
            const d=DAYS.find(x=>x.id===e.day_of_week)
            const p=periods.find((x:Row)=>x.id===e.period_id)
            return <option key={e.id} value={e.id}>{d?.label} · {p?.label} · {e.subject} · {classById(e.class_id)?.name}</option>
          })}</select></div>
          <div className="field"><label>DATE</label><input type="date" name="date" required/></div>
          <div className="field"><label>SUBSTITUTE TEACHER</label><TeacherPicker name="substitute_teacher_id" required={true} allowEmpty={false} placeholder="Search substitute teacher code, ID or name…"/></div>
          <div className="field full"><label>REASON</label><textarea name="reason" rows={3} placeholder="Teacher leave / official duty"/></div>
          <button className="btn btn-primary full" disabled={busy}>{busy?'Assigning…':'Assign substitute'}</button>
        </form>
      </div>
    </div>}
  </>
}
