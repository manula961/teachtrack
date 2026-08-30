'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { Heart } from 'lucide-react'
const labels:Record<string,string>={'/dashboard':'Command Center','/today':'Today','/my-hub':'My Professional Hub','/teacher-360':'Teacher 360°','/intelligence':'Growth Intelligence','/analytics':'Visual Analytics','/timetable':'Timetable','/lessons':'Lesson Plans','/training':'Training & Certifications','/portfolio':'Printable Portfolio','/notifications':'Smart Notifications','/departments':'Departments','/classes':'Classes & Grades','/goals':'Goals','/achievements':'Achievements'}
export default function Favorites(){
 const[rows,setRows]=useState<string[]>([])
 useEffect(()=>{try{setRows(JSON.parse(localStorage.getItem('tt-favorites')||'[]'))}catch{}},[])
 function remove(href:string){const next=rows.filter(x=>x!==href);setRows(next);localStorage.setItem('tt-favorites',JSON.stringify(next))}
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Pinned shortcuts</span><h1 style={{marginTop:14}}>Favorites</h1><p>Pin frequently used pages with the heart button in the top bar.</p></div></div><div className="cards">{rows.map(href=><article className="feature-card" key={href}><Heart size={20}/><h3>{labels[href]||href.replace('/','').replace(/-/g,' ')}</h3><p>{href}</p><div className="toolbar"><Link href={href} className="btn btn-primary">Open →</Link><button className="btn" onClick={()=>remove(href)}>Remove</button></div></article>)}{!rows.length&&<div className="panel empty">No favorites yet. Open a page and press the heart icon in the top bar.</div>}</div></>
}
