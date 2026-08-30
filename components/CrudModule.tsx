'use client'
import { useEffect,useMemo,useRef,useState } from 'react'
import { Columns3,Download,Plus,Trash2,Undo2,X } from 'lucide-react'
import { useData } from './DataProvider'
import { TeacherPicker } from './TeacherPicker'

type Field={name:string;label:string;type?:string;options?:string[];placeholder?:string;required?:boolean}
type Props={title:string;eyebrow:string;description:string;table:string;fields:Field[];columns:{key:string;label:string}[];leadershipOnly?:boolean}

export function CrudModule({title,eyebrow,description,table,fields,columns,leadershipOnly=false}:Props){
 const {data,loading,role,insert,remove}=useData()
 const[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState(''),[sort,setSort]=useState<{key:string;dir:1|-1}|null>(null)
 const[hidden,setHidden]=useState<string[]>([]),[limit,setLimit]=useState(25),[selected,setSelected]=useState<number[]>([]),[deleted,setDeleted]=useState<any|null>(null),[formProgress,setFormProgress]=useState(0),[hasDraft,setHasDraft]=useState(false)
 const formRef=useRef<HTMLFormElement>(null)
 const leadership=['principal','vice_principal'].includes(role),rows=data[table]||[],teachers=data.teachers_dashboard||[]
 const draftKey=`tt-draft-${table}`

 useEffect(()=>{try{setQuery(localStorage.getItem(`tt-filter-${table}`)||'');setHidden(JSON.parse(localStorage.getItem(`tt-columns-${table}`)||'[]'));setHasDraft(Boolean(localStorage.getItem(draftKey)))}catch{}},[table,draftKey])
 useEffect(()=>{localStorage.setItem(`tt-filter-${table}`,query);setLimit(25)},[query,table])
 const filtered=useMemo(()=>{let out=rows.filter((r:any)=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));if(sort)out=[...out].sort((a:any,b:any)=>String(a[sort.key]??'').localeCompare(String(b[sort.key]??''),undefined,{numeric:true})*sort.dir);return out},[rows,query,sort])
 const visibleColumns=columns.filter(c=>!hidden.includes(c.key)),visible=filtered.slice(0,limit),canEdit=!leadershipOnly||leadership

 function toggleColumn(key:string){const next=hidden.includes(key)?hidden.filter(x=>x!==key):[...hidden,key];setHidden(next);localStorage.setItem(`tt-columns-${table}`,JSON.stringify(next))}
 const teacherById=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))
 function displayCell(row:any,key:string):React.ReactNode{
  const value=row[key];if(value==null||value==='')return '—'
  if(key.toLowerCase().includes('teacher_id')){
   const t=teacherById(value)
   return t?<button className="teacher-cell-button" onClick={()=>window.dispatchEvent(new CustomEvent('tt-teacher-quick',{detail:{teacherId:t.id}}))}>{t.teacher_code||`ID ${t.id}`} · {t.name||'Teacher'}</button>:`Teacher ID ${value}`
  }
  if(table==='school_org_units'&&key==='parent_id'){const parent=rows.find((x:any)=>String(x.id)===String(value));return parent?.name||`Unit ID ${value}`}
  return String(value)
 }
 function cellText(row:any,key:string){const value=row[key];if(value==null||value==='')return '—';if(key.toLowerCase().includes('teacher_id')){const t=teacherById(value);return t?`${t.teacher_code||`ID ${t.id}`} · ${t.name||'Teacher'}`:`Teacher ID ${value}`};return String(value)}
 function exportCsv(target=filtered){const q=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`;const csv=[visibleColumns.map(c=>q(c.label)).join(','),...target.map(r=>visibleColumns.map(c=>q(cellText(r,c.key))).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${table}.csv`;a.click();URL.revokeObjectURL(url)}
 function updateProgress(form:HTMLFormElement){const required=fields.filter(f=>f.required);if(!required.length)return setFormProgress(100);const fd=new FormData(form),filled=required.filter(f=>String(fd.get(f.name)||'').trim()).length;setFormProgress(Math.round(filled/required.length*100))}
 function saveDraft(form:HTMLFormElement){const payload=Object.fromEntries(new FormData(form).entries());localStorage.setItem(draftKey,JSON.stringify({payload,savedAt:new Date().toISOString(),href:location.pathname,label:title}));setHasDraft(true);setMsg(navigator.onLine?'Draft saved locally.':'Offline draft queued locally.')}
 function restoreDraft(){
  const form=formRef.current;if(!form)return
  try{const d=JSON.parse(localStorage.getItem(draftKey)||'null');if(!d?.payload)return;for(const[k,v]of Object.entries(d.payload)){const el=form.elements.namedItem(k) as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null;if(el&&el.type!=='hidden')el.value=String(v??'')}updateProgress(form);setMsg('Draft restored.')}catch{}
 }
 function duplicateLikely(payload:any){
  const keys=fields.filter(f=>payload[f.name]!==undefined&&payload[f.name]!==''&&!['notes','description','reason'].includes(f.name)).slice(0,3).map(f=>f.name)
  return keys.length>=2&&rows.some((r:any)=>keys.every(k=>String(r[k]??'').trim().toLowerCase()===String(payload[k]??'').trim().toLowerCase()))
 }
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMsg('');const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null,again=submitter?.value==='again'
  const fd=new FormData(e.currentTarget),payload:any={}
  for(const f of fields){const raw=fd.get(f.name),text=typeof raw==='string'?raw.trim():raw;if((text===''||text===null)&&!f.required)continue;if(f.type==='number'){const n=Number(text);if(Number.isNaN(n)){setMsg(`${f.label} must be a valid number.`);setBusy(false);return}payload[f.name]=n}else payload[f.name]=text}
  if(duplicateLikely(payload)&&!window.confirm('A similar record already exists. Save this possible duplicate anyway?')){setBusy(false);return}
  if(!navigator.onLine){saveDraft(e.currentTarget);setBusy(false);return}
  try{await insert(table,payload);localStorage.removeItem(draftKey);setHasDraft(false);setMsg('Saved successfully.');if(again){e.currentTarget.reset();setFormProgress(0)}else setOpen(false)}
  catch(err:any){saveDraft(e.currentTarget);setMsg(([err?.message,err?.details,err?.hint].filter(Boolean).join(' · ')||'Unable to save.')+' Your draft was kept locally.')}
  setBusy(false)
 }
 async function deleteRow(r:any){const name=r.name||r.title||r.topic||`record ${r.id}`;if(!window.confirm(`Delete ${name}? You can undo immediately after deletion.`))return;try{await remove(table,r.id);setDeleted(r);setMsg(`${name} deleted.`)}catch(err:any){setMsg(err?.message||'Unable to delete.')}}
 async function undoDelete(){if(!deleted)return;const payload={...deleted};delete payload.id;delete payload.created_at;delete payload.updated_at;try{await insert(table,payload);setMsg('Deletion undone.');setDeleted(null)}catch(err:any){setMsg(`Undo failed: ${err.message}`)}}
 async function bulkDelete(){const chosen=rows.filter((r:any)=>selected.includes(Number(r.id)));if(!chosen.length||!window.confirm(`Delete ${chosen.length} selected records?`))return;for(const r of chosen)await remove(table,r.id);setSelected([]);setMsg(`${chosen.length} records deleted.`)}
 function suggestions(f:Field){return [...new Set(rows.map((r:any)=>String(r[f.name]??'').trim()).filter(Boolean))].slice(0,20)}

 return <>{loading?<div className="loading">Loading secure school data…</div>:<>
  <div className="page-head"><div><span className="eyebrow"><i className="dot"/>{eyebrow}</span><h1 style={{marginTop:14}}>{title}</h1><p>{description}</p></div><div className="toolbar global-search"><input className="search" placeholder="Search records…" value={query} onChange={e=>setQuery(e.target.value)}/><details className="column-menu"><summary className="btn"><Columns3 size={15}/> Columns</summary><div className="column-menu-pop">{columns.map(c=><label key={c.key}><input type="checkbox" checked={!hidden.includes(c.key)} onChange={()=>toggleColumn(c.key)}/>{c.label}</label>)}</div></details><button className="btn" onClick={()=>exportCsv(selected.length?rows.filter((r:any)=>selected.includes(Number(r.id))):filtered)} disabled={!filtered.length}><Download size={15}/> {selected.length?`Export ${selected.length}`:'Export'}</button>{canEdit&&<button className="btn btn-primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add record</button>}</div></div>
  {query&&<div className="filter-chips"><span>Search: {query}<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={12}/></button></span></div>}
  {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><div className="toolbar">{deleted&&<button className="btn" onClick={undoDelete}><Undo2 size={14}/> Undo</button>}<i className="pulse"/></div></div>}
  {selected.length>0&&<div className="bulk-bar"><b>{selected.length} selected</b><button className="btn" onClick={()=>setSelected([])}>Clear</button>{canEdit&&<button className="btn" onClick={bulkDelete}><Trash2 size={14}/> Delete selected</button>}</div>}
  <section className="panel"><div className="table-wrap responsive-table"><table className="table"><thead><tr><th><input type="checkbox" aria-label="Select visible records" checked={visible.length>0&&visible.every((r:any)=>selected.includes(Number(r.id)))} onChange={e=>setSelected(e.target.checked?[...new Set([...selected,...visible.map((r:any)=>Number(r.id))])]:selected.filter(id=>!visible.some((r:any)=>Number(r.id)===id)))}/></th>{visibleColumns.map(c=><th key={c.key}><button className="sort-head" onClick={()=>setSort(s=>s?.key===c.key?{key:c.key,dir:s.dir===1?-1:1}:{key:c.key,dir:1})}>{c.label}{sort?.key===c.key?(sort.dir===1?' ↑':' ↓'):''}</button></th>)}{canEdit&&<th/>}</tr></thead><tbody>
   {visible.map((r:any)=><tr key={r.id}><td data-label="Select"><input type="checkbox" checked={selected.includes(Number(r.id))} onChange={e=>setSelected(s=>e.target.checked?[...s,Number(r.id)]:s.filter(x=>x!==Number(r.id)))}/></td>{visibleColumns.map(c=><td data-label={c.label} key={c.key}>{displayCell(r,c.key)}</td>)}{canEdit&&<td data-label="Actions"><button className="btn" onClick={()=>deleteRow(r)} title="Delete record"><Trash2 size={14}/></button></td>}</tr>)}
  </tbody></table>{!filtered.length&&<div className="empty">{query?'No records match your search. Clear the search or try another term.':canEdit?'No records yet. Use “Add record” to create the first one.':'No records are available for your account.'}</div>}</div>{visible.length<filtered.length&&<div className="load-more"><button className="btn" onClick={()=>setLimit(x=>x+25)}>Load 25 more</button></div>}</section>
  {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}><div className="modal modal-form" role="dialog" aria-modal="true" aria-labelledby={`${table}-form-title`}><div className="panel-head"><div><small>{eyebrow}</small><h2 id={`${table}-form-title`}>Add record</h2><p>Dates default to today. Drafts are kept locally if saving fails.</p></div><button className="btn" onClick={()=>setOpen(false)}>Close</button></div>
   <div className="form-progress"><span style={{width:`${formProgress}%`}}/><small>{formProgress}% required fields complete</small></div>
   <form ref={formRef} onInput={e=>updateProgress(e.currentTarget)} onChange={e=>{updateProgress(e.currentTarget);saveDraft(e.currentTarget)}} onSubmit={submit} className="form-grid">{fields.map(f=><div className={`field ${f.type==='textarea'?'full':''}`} key={f.name}><label>{f.label}{f.required?' *':''}</label>
    {f.name.toLowerCase().includes('teacher_id')?<TeacherPicker name={f.name} required={f.required} placeholder={f.placeholder}/>:
    f.options?<select name={f.name} required={f.required}><option value="">Select…</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>:
    f.type==='textarea'?<textarea name={f.name} rows={4} required={f.required} placeholder={f.placeholder}/>:
    <><input name={f.name} list={`suggest-${table}-${f.name}`} type={f.type||'text'} required={f.required} placeholder={f.placeholder} defaultValue={f.type==='date'?new Date().toISOString().slice(0,10):undefined}/>{f.type!=='number'&&f.type!=='date'&&f.type!=='datetime-local'&&suggestions(f).length>0&&<datalist id={`suggest-${table}-${f.name}`}>{suggestions(f).map(x=><option key={x} value={x}/>)}</datalist>}</>}
   </div>)}<div className="toolbar full"><button className="btn" type="button" onClick={()=>formRef.current&&saveDraft(formRef.current)}>Save draft</button>{hasDraft&&<button className="btn" type="button" onClick={restoreDraft}>Restore draft</button>}<button className="btn" type="submit" value="again" disabled={busy}>{busy?'Saving…':'Save & add another'}</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy?'Saving…':'Save'}</button></div></form>
  </div></div>}
 </>}</>
}
