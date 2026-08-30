'use client'
import Link from 'next/link'
import { useEffect,useMemo,useState } from 'react'
import { Eye,EyeOff,GripVertical,Maximize2,Minimize2 } from 'lucide-react'
import { useData } from './DataProvider'
import { derivedAlerts } from '@/lib/teacherInsights'
type Widget={id:string;title:string;value:string|number;note:string;href:string;wide?:boolean}
export function DashboardWidgetBoard(){
 const{data}=useData()
 const base:Widget[]=useMemo(()=>[
  {id:'actions',title:'Action Center',value:derivedAlerts(data).length,note:'Open attention items',href:'/action-center'},
  {id:'training',title:'Professional Development',value:(data.training||[]).length,note:'Training records',href:'/training'},
  {id:'goals',title:'Active Goals',value:(data.goals||[]).filter((x:any)=>x.status==='Active').length,note:'Current development targets',href:'/goals'},
  {id:'achievements',title:'Recognition',value:(data.achievements||[]).length,note:'Achievements recorded',href:'/achievement-wall'},
  {id:'documents',title:'Evidence',value:(data.teacher_documents||[]).length,note:'Secure documents',href:'/documents'},
  {id:'calendar',title:'Calendar',value:(data.school_events||[]).length,note:'School events',href:'/calendar-view'},
 ],[data])
 const[order,setOrder]=useState<string[]>([]),[hidden,setHidden]=useState<string[]>([]),[wide,setWide]=useState<string[]>([]),[drag,setDrag]=useState('')
 useEffect(()=>{try{setOrder(JSON.parse(localStorage.getItem('tt-widget-order')||'[]'));setHidden(JSON.parse(localStorage.getItem('tt-widget-hidden')||'[]'));setWide(JSON.parse(localStorage.getItem('tt-widget-wide')||'[]'))}catch{}},[])
 const widgets=[...base].sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?999:ai)-(bi<0?999:bi)})
 function save(nextOrder=order,nextHidden=hidden,nextWide=wide){localStorage.setItem('tt-widget-order',JSON.stringify(nextOrder));localStorage.setItem('tt-widget-hidden',JSON.stringify(nextHidden));localStorage.setItem('tt-widget-wide',JSON.stringify(nextWide))}
 function drop(id:string){if(!drag||drag===id)return;const ids=widgets.map(w=>w.id).filter(x=>x!==drag),at=ids.indexOf(id);ids.splice(at,0,drag);setOrder(ids);save(ids);setDrag('')}
 function toggleHidden(id:string){const n=hidden.includes(id)?hidden.filter(x=>x!==id):[...hidden,id];setHidden(n);save(order,n,wide)}
 function toggleWide(id:string){const n=wide.includes(id)?wide.filter(x=>x!==id):[...wide,id];setWide(n);save(order,hidden,n)}
 return <section className="panel dashboard-widget-panel"><div className="panel-head"><div><small>PERSONAL WORKSPACE</small><h3>Smart home widgets</h3><p>Drag to reorder. Hide or enlarge widgets for this browser.</p></div><div className="widget-hidden-menu">{hidden.length>0&&<details><summary className="btn"><Eye size={14}/> Hidden ({hidden.length})</summary><div className="column-menu-pop">{hidden.map(id=><button key={id} onClick={()=>toggleHidden(id)}>{base.find(w=>w.id===id)?.title||id}</button>)}</div></details>}</div></div><div className="dashboard-widget-grid">{widgets.filter(w=>!hidden.includes(w.id)).map(w=><article draggable onDragStart={()=>setDrag(w.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(w.id)} className={`dashboard-widget ${wide.includes(w.id)?'wide':''}`} key={w.id}><div className="widget-tools"><GripVertical size={15}/><button onClick={()=>toggleWide(w.id)} aria-label="Resize widget">{wide.includes(w.id)?<Minimize2 size={13}/>:<Maximize2 size={13}/>}</button><button onClick={()=>toggleHidden(w.id)} aria-label="Hide widget"><EyeOff size={13}/></button></div><Link href={w.href}><small>{w.title.toUpperCase()}</small><b>{w.value}</b><span>{w.note}</span></Link></article>)}</div></section>
}
