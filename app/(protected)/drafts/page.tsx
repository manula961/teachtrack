'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { FileClock,Trash2 } from 'lucide-react'
type Draft={key:string;payload:Record<string,any>;savedAt:string;href:string;label:string}
export default function Drafts(){
 const[rows,setRows]=useState<Draft[]>([])
 function load(){const out:Draft[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith('tt-draft-'))continue;try{const d=JSON.parse(localStorage.getItem(key)||'{}');out.push({key,...d})}catch{}}setRows(out.sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt))))}
 useEffect(()=>load(),[])
 function remove(key:string){localStorage.removeItem(key);load()}
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Draft recovery</span><h1 style={{marginTop:14}}>Saved & offline drafts</h1><p>Forms saved locally because you chose Save Draft, lost connection, or a write failed.</p></div></div><section className="panel">{rows.map(d=><div className="queue-row" key={d.key}><div><FileClock size={15} style={{verticalAlign:'middle',marginRight:7}}/><b>{d.label||d.key.replace('tt-draft-','')}</b><small>Saved {new Date(d.savedAt).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})} · {Object.keys(d.payload||{}).length} fields</small></div><div className="toolbar"><Link className="btn btn-primary" href={d.href||'/dashboard'}>Resume</Link><button className="btn" onClick={()=>remove(d.key)}><Trash2 size={14}/></button></div></div>)}{!rows.length&&<div className="empty">No saved drafts. Forms will appear here when you save a draft or a network write fails.</div>}</section></>
}
