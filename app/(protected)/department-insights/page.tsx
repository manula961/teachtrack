'use client'
import { useEffect, useState } from 'react'
import { useData } from '@/components/DataProvider'
import { composite } from '@/lib/teacherInsights'

export default function DepartmentInsights(){
 const {data,loading,role}=useData();const departments=data.departments||[],classes=data.timetable_classes||[],teachers=data.teachers_dashboard||[]
 const [id,setId]=useState(String(departments[0]?.id||''))
 useEffect(()=>{const v=new URLSearchParams(window.location.search).get('department');if(v)setId(v)},[])
 const d=departments.find((x:any)=>String(x.id)===id)||departments[0]
 if(loading)return <div className="loading">Building department dashboard…</div>
 if(!['principal','vice_principal','section_head','reviewer'].includes(role))return <div className="panel empty">Department dashboards are available to school leadership and reviewers.</div>
 if(!d)return <div className="panel empty">Create departments first.</div>
 const dClasses=classes.filter((c:any)=>String(c.department_id)===String(d.id))
 const classTeacherIds=new Set(dClasses.map((c:any)=>String(c.class_teacher_id||'')))
 const dTeachers=teachers.filter((t:any)=>String(t.department||'').toLowerCase()===String(d.name||'').toLowerCase()||classTeacherIds.has(String(t.id))||String(t.section||'').toLowerCase()===String(d.name||'').toLowerCase())
 const avg=dTeachers.length?Math.round(dTeachers.reduce((s:number,t:any)=>s+composite(data,t).score,0)/dTeachers.length):0
 const students=dClasses.reduce((s:number,c:any)=>s+Number(c.student_count||0),0)
 const head=teachers.find((t:any)=>String(t.id)===String(d.head_teacher_id))
 return <>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>Department dashboard</span><h1 style={{marginTop:14}}>{d.name}</h1><p>Classes, HOS, students and teacher-development health for one academic unit.</p></div><select className="search" value={String(d.id)} onChange={e=>setId(e.target.value)}>{departments.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
  <div className="kpis"><div className="kpi"><small>HOS</small><b style={{fontSize:22}}>{head?.name||'Unassigned'}</b><span>{head?.teacher_code||'Assign in Departments'}</span></div><div className="kpi"><small>CLASSES</small><b>{dClasses.length}</b><span>Assigned classes</span></div><div className="kpi"><small>STUDENTS</small><b>{students}</b><span>Declared class totals</span></div><div className="kpi"><small>AVG PERFORMANCE</small><b>{avg}%</b><span>{dTeachers.length} linked teachers</span></div></div>
  <div className="grid-2" style={{marginTop:18}}><section className="panel"><div className="panel-head"><div><h3>Classes</h3><p>Current department structure</p></div></div>{dClasses.map((c:any)=><div className="metric" key={c.id}><span>{c.name} · {c.medium}</span><b>{c.student_count||0} students</b></div>)}{!dClasses.length&&<div className="empty">No classes assigned.</div>}</section><section className="panel"><div className="panel-head"><div><h3>Teacher development</h3><p>Linked class/department teachers</p></div></div>{dTeachers.slice(0,20).map((t:any)=><div className="metric" key={t.id}><span>{t.teacher_code||`ID ${t.id}`} · {t.name}</span><b>{composite(data,t).score}%</b></div>)}{!dTeachers.length&&<div className="empty">No linked teachers.</div>}</section></div>
 </>
}
