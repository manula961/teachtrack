'use client'
import { useMemo,useState } from 'react'
import { ArrowUpRight,GraduationCap,PlayCircle,ShieldCheck,AlertTriangle } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { createClient } from '@/lib/supabase/client'

function gradeNumber(v:string){const m=String(v||'').match(/(\d+)/);return m?Number(m[1]):0}
function nextClassName(name:string,fromGrade:number,toGrade:number){
 const re=new RegExp(`(^|\\D)${fromGrade}(?=\\D|$)`)
 if(re.test(name))return name.replace(re,(m,p1)=>`${p1}${toGrade}`)
 return `${toGrade}-${name.replace(/^Grade\s*\d+\s*/i,'').replace(/^\d+\s*[-–]\s*/,'')}`
}
export default function SchoolPromotion(){
 const {data,loading,role,refresh}=useData();const leadership=['principal','vice_principal'].includes(role)
 const years:number[]=Array.from(new Set<number>((data.timetable_classes||[]).map((c:any)=>Number(c.academic_year||new Date().getFullYear())))).sort((a:number,b:number)=>b-a)
 const[fromYear,setFromYear]=useState(years[0]||new Date().getFullYear());const[toYear,setToYear]=useState((years[0]||new Date().getFullYear())+1);const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false)
 const classes=(data.timetable_classes||[]).filter((c:any)=>Number(c.academic_year||new Date().getFullYear())===fromYear)
 const history=data.school_year_promotions||[]
 const targetClasses=(data.timetable_classes||[]).filter((c:any)=>Number(c.academic_year)===toYear)
 const preview=useMemo(()=>classes.map((c:any)=>{const g=gradeNumber(c.grade);const graduate=g>=13;const targetName=graduate?'Graduated / Alumni':nextClassName(c.name,g,g+1);const already=history.some((h:any)=>Number(h.from_year)===fromYear&&Number(h.to_year)===toYear&&String(h.source_class_id)===String(c.id));const targetExists=!graduate&&targetClasses.some((x:any)=>String(x.name).toLowerCase()===targetName.toLowerCase());return {source:c,grade:g,graduate,targetGrade:graduate?null:g+1,targetName,already,targetExists,eligible:!already&&!targetExists}}),[classes,history,targetClasses,fromYear,toYear])
 const eligible=preview.filter(p=>p.eligible),blocked=preview.filter(p=>!p.eligible)
 async function promote(){
  if(!leadership||!eligible.length)return
  if(toYear<=fromYear){setMsg('Target year must be later than the source year.');return}
  if(!window.confirm(`Promote ${eligible.length} class structure(s) from ${fromYear} to ${toYear}? This action will not copy timetables or class-teacher assignments.`))return
  setBusy(true);const supabase=createClient();let created=0,graduated=0,failed=0
  for(const p of eligible){
   if(p.graduate){const log=await supabase.from('school_year_promotions').insert({from_year:fromYear,to_year:toYear,source_class_id:p.source.id,source_class_name:p.source.name,target_class_name:'Graduated / Alumni',status:'Graduated'});if(log.error)failed++;else graduated++;continue}
   const payload={name:p.targetName,grade:`Grade ${p.targetGrade}`,section:p.source.section||'',medium:p.source.medium||'English',class_teacher_id:null,room:p.source.room||'',student_count:Number(p.source.student_count||0),active:true,academic_year:toYear}
   const ins=await supabase.from('timetable_classes').insert(payload).select('id').single()
   if(ins.error){failed++;continue}
   const log=await supabase.from('school_year_promotions').insert({from_year:fromYear,to_year:toYear,source_class_id:p.source.id,target_class_id:ins.data.id,source_class_name:p.source.name,target_class_name:p.targetName,status:'Completed'})
   if(log.error){await supabase.from('timetable_classes').delete().eq('id',ins.data.id);failed++}else created++
  }
  await refresh();setBusy(false);setMsg(`Promotion finished safely: ${created} class(es) created, ${graduated} Grade 13 class(es) graduated, ${blocked.length} already-existing/previously-promoted item(s) skipped${failed?`, ${failed} item(s) failed and were not committed`:''}.`)
 }
 if(loading)return <div className="loading">Preparing promotion plan…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Academic year transition</span><h1 style={{marginTop:14}}>School Year Promotion Tool</h1><p>Preflight-check the next academic year, prevent duplicate promotions, graduate Grade 13 and preserve historical records.</p></div>{leadership&&<button className="btn btn-primary" disabled={busy||!eligible.length||toYear<=fromYear} onClick={promote}><PlayCircle size={16}/> {busy?'Promoting…':`Promote ${eligible.length} safe item(s)`}</button>}</div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>PROMOTION STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="grid-2"><section className="panel"><div className="panel-head"><div><h2>Promotion settings</h2><p>Choose source and target academic years.</p></div><GraduationCap/></div><div className="form-grid"><div className="field"><label>FROM YEAR</label><select value={fromYear} onChange={e=>{const y=Number(e.target.value);setFromYear(y);setToYear(y+1)}}>{years.map(y=><option key={y}>{y}</option>)}</select></div><div className="field"><label>TO YEAR</label><input type="number" min={fromYear+1} value={toYear} onChange={e=>setToYear(Number(e.target.value))}/></div></div><div className="command" style={{marginTop:18}}><ShieldCheck/><div><small>3-LAYER SAFETY</small><b>Preflight duplicate scan + confirmation + database unique constraint.</b></div></div></section>
 <section className="panel"><div className="panel-head"><div><h2>Transition summary</h2><p>Only safe rows are eligible.</p></div></div><div className="metric"><span>Source classes</span><b>{preview.length}</b></div><div className="metric"><span>Safe to promote</span><b>{eligible.length}</b></div><div className="metric"><span>Blocked / already done</span><b>{blocked.length}</b></div><div className="metric"><span>Grade 13 graduation</span><b>{eligible.filter(p=>p.graduate).length}</b></div></section></div>
 {blocked.length>0&&<div className="command" style={{marginTop:18}}><AlertTriangle/><div><small>SAFETY CHECK</small><b>{blocked.length} item(s) will be skipped because the source was already promoted or the target class already exists.</b></div></div>}
 <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h2>Promotion preview</h2><p>Class structures planned for {toYear}.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>{fromYear}</th><th>Current grade</th><th/><th>{toYear}</th><th>Next grade</th><th>Safety</th></tr></thead><tbody>{preview.map(p=><tr key={p.source.id}><td><b>{p.source.name}</b></td><td>{p.source.grade}</td><td><ArrowUpRight size={15}/></td><td><b>{p.targetName}</b></td><td>{p.graduate?'Graduated':`Grade ${p.targetGrade}`}</td><td><span className={`status ${p.eligible?'good':''}`}>{p.already?'Already promoted':p.targetExists?'Target exists':'Ready'}</span></td></tr>)}</tbody></table>{!preview.length&&<div className="empty">No classes found for the selected source year.</div>}</div></section>
 <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h3>Promotion history</h3><p>Audit record of class-year transitions.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>From</th><th>To</th><th>Source class</th><th>Target class</th><th>Status</th><th>Time</th></tr></thead><tbody>{history.slice().sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at))).map((r:any)=><tr key={r.id}><td>{r.from_year}</td><td>{r.to_year}</td><td>{r.source_class_name}</td><td>{r.target_class_name}</td><td><span className="status good">{r.status}</span></td><td>{new Date(r.created_at).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})}</td></tr>)}</tbody></table></div></section></>
}
