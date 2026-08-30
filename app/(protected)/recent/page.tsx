'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { Clock3, Trash2 } from 'lucide-react'
export default function Recent(){
 const[rows,setRows]=useState<{href:string,label:string}[]>([])
 useEffect(()=>{try{setRows(JSON.parse(localStorage.getItem('tt-recent')||'[]'))}catch{}},[])
 function clear(){localStorage.removeItem('tt-recent');setRows([])}
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Navigation memory</span><h1 style={{marginTop:14}}>Recently viewed</h1><p>Jump back to the modules you were using without searching again.</p></div>{rows.length>0&&<button className="btn" onClick={clear}><Trash2 size={15}/> Clear</button>}</div><section className="panel">{rows.map((r,i)=><Link className="queue-row" href={r.href} key={`${r.href}-${i}`}><div><b>{r.label}</b><small>{r.href}</small></div><Clock3 size={17}/></Link>)}{!rows.length&&<div className="empty">No recent pages yet. Open any module and it will appear here automatically.</div>}</section></>
}
