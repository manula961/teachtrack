'use client'
import { useEffect,useMemo,useRef,useState } from 'react'
import { Clipboard,Search,UserRound,X } from 'lucide-react'
import { useData } from './DataProvider'

type Props={name:string;label?:string;required?:boolean;defaultValue?:number|string|null;allowEmpty?:boolean;placeholder?:string}

export function TeacherPicker({name,label,required=false,defaultValue=null,allowEmpty=true,placeholder='Search teacher code, ID or name…'}:Props){
 const{data}=useData();const teachers=data.teachers_dashboard||[],rootRef=useRef<HTMLDivElement>(null),inputRef=useRef<HTMLInputElement>(null)
 const[selectedId,setSelectedId]=useState(defaultValue==null?'':String(defaultValue)),[query,setQuery]=useState(''),[focused,setFocused]=useState(false),[active,setActive]=useState(0),[recent,setRecent]=useState<string[]>([])
 const selected=useMemo(()=>teachers.find((t:any)=>String(t.id)===selectedId),[teachers,selectedId])
 useEffect(()=>{const next=defaultValue==null?'':String(defaultValue);setSelectedId(next);if(!next)setQuery('')},[defaultValue])
 useEffect(()=>{if(selected)setQuery(`${selected.teacher_code||`ID ${selected.id}`} — ${selected.name||'Teacher'}`)},[selected])
 useEffect(()=>{try{setRecent(JSON.parse(localStorage.getItem('tt-recent-teachers')||'[]'))}catch{}},[])
 useEffect(()=>{function outside(e:MouseEvent){if(rootRef.current&&!rootRef.current.contains(e.target as Node))setFocused(false)}document.addEventListener('mousedown',outside);return()=>document.removeEventListener('mousedown',outside)},[])
 useEffect(()=>{inputRef.current?.setCustomValidity(required&&!selectedId?'Select a teacher from the search results.':'')},[required,selectedId])
 const matches=useMemo(()=>{
  if(selectedId)return[]
  const q=query.trim().toLowerCase()
  const activeTeachers=teachers.filter((t:any)=>t.status!=='Inactive')
  if(!q)return recent.map(id=>activeTeachers.find((t:any)=>String(t.id)===id)).filter(Boolean).slice(0,6)
  return activeTeachers.filter((t:any)=>[t.id,t.teacher_code,t.name,t.subject,t.department,t.section].some(v=>String(v??'').toLowerCase().includes(q))).slice(0,8)
 },[teachers,query,selectedId,recent])
 const showResults=focused&&!selectedId&&(query.trim().length>0||recent.length>0)
 function choose(t:any){
  setSelectedId(String(t.id));setQuery(`${t.teacher_code||`ID ${t.id}`} — ${t.name||'Teacher'}`);setFocused(false);setActive(0)
  const next=[String(t.id),...recent.filter(x=>x!==String(t.id))].slice(0,6);setRecent(next);localStorage.setItem('tt-recent-teachers',JSON.stringify(next))
 }
 function clear(){setSelectedId('');setQuery('');setFocused(true);setActive(0)}
 function keyDown(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowDown'&&showResults){e.preventDefault();setActive(x=>Math.min(matches.length-1,x+1))}
  else if(e.key==='ArrowUp'&&showResults){e.preventDefault();setActive(x=>Math.max(0,x-1))}
  else if(e.key==='Enter'&&showResults&&matches[active]){e.preventDefault();choose(matches[active])}
  else if(e.key==='Escape'){setFocused(false)}
 }
 return <div className="teacher-picker" ref={rootRef}>
  {label&&<label>{label}</label>}<input type="hidden" name={name} value={selectedId}/>
  <div className="teacher-picker-input"><Search size={16}/><input ref={inputRef} value={query} onFocus={()=>setFocused(true)} onKeyDown={keyDown} onChange={e=>{setQuery(e.target.value);setSelectedId('');setFocused(true);setActive(0)}} placeholder={placeholder} autoComplete="off" aria-label={label||'Teacher search'} aria-expanded={showResults}/>{selectedId&&allowEmpty&&<button type="button" onClick={clear} aria-label="Clear teacher"><X size={16}/></button>}</div>
  {showResults&&<div className="teacher-picker-menu" role="listbox">{!query.trim()&&recent.length>0&&<div className="teacher-picker-section-label">RECENTLY USED</div>}{matches.map((t:any,i:number)=><button type="button" role="option" aria-selected={i===active} className={`teacher-picker-option ${i===active?'active':''}`} key={t.id} onMouseEnter={()=>setActive(i)} onClick={()=>choose(t)}><UserRound size={17}/><span className="teacher-picker-option-copy"><span className="teacher-picker-option-main"><b>{t.name||`Teacher #${t.id}`}</b><strong>{t.teacher_code||`ID ${t.id}`}</strong></span><small>ID {t.id}{t.subject?` · ${t.subject}`:''}{t.department?` · ${t.department}`:''}{t.section&&t.section!==t.department?` · ${t.section}`:''}</small></span></button>)}{query.trim()&&!matches.length&&<div className="teacher-picker-empty">No matching teacher found.</div>}</div>}
  {required&&!selectedId&&query.trim()&&!showResults&&<small className="teacher-picker-help">Select a teacher from the search results.</small>}
  {selected&&<div className="teacher-picker-selected"><small className="teacher-picker-help">Selected: <b>{selected.teacher_code||`ID ${selected.id}`}</b> · {selected.name}</small><span className="teacher-picker-selected-actions">{selected.teacher_code&&<button type="button" onClick={()=>navigator.clipboard?.writeText(selected.teacher_code)} title="Copy teacher code"><Clipboard size={12}/> Copy code</button>}<button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('tt-teacher-quick',{detail:{teacherId:selected.id}}))}>Quick view</button></span></div>}
 </div>
}
