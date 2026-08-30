'use client'
import { useData } from '@/components/DataProvider'
export default function Alerts(){
 const {data,loading}=useData();if(loading)return <div className="loading">Checking expiries…</div>
 const today=new Date(),cutoff=new Date(Date.now()+90*86400000)
 const docs=(data.teacher_documents||[]).filter((x:any)=>x.expiry_date&&new Date(x.expiry_date)>=today&&new Date(x.expiry_date)<=cutoff)
 const training=(data.training||[]).filter((x:any)=>x.expiry_date&&new Date(x.expiry_date)>=today&&new Date(x.expiry_date)<=cutoff)
 const teachers=data.teachers_dashboard||[];const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id))?.name||`Teacher ${id}`
 const items=[...docs.map((x:any)=>({type:'Document',title:x.title,date:x.expiry_date,teacher:teacher(x.teacher_id)})),...training.map((x:any)=>({type:'Certification',title:x.title,date:x.expiry_date,teacher:teacher(x.teacher_id)}))].sort((a,b)=>String(a.date).localeCompare(String(b.date)))
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Expiry intelligence</span><h1 style={{marginTop:14}}>Certification & document alerts</h1><p>Items expiring within the next 90 days are surfaced automatically.</p></div></div><div className="kpis"><div className="kpi"><small>EXPIRING ITEMS</small><b>{items.length}</b><span>Next 90 days</span></div><div className="kpi"><small>DOCUMENTS</small><b>{docs.length}</b><span>Secure vault</span></div><div className="kpi"><small>CERTIFICATIONS</small><b>{training.length}</b><span>Training records</span></div><div className="kpi"><small>STATUS</small><b>{items.length?'Review':'Clear'}</b><span>Renewal monitoring</span></div></div>
 <section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Expiry</th><th>Teacher</th><th>Type</th><th>Item</th><th>Urgency</th></tr></thead><tbody>{items.map((x:any,i)=>{const days=Math.ceil((new Date(x.date).getTime()-Date.now())/86400000);return <tr key={i}><td>{x.date}</td><td>{x.teacher}</td><td>{x.type}</td><td>{x.title}</td><td><span className={`status ${days>30?'good':''}`}>{days} days</span></td></tr>})}</tbody></table>{!items.length&&<div className="empty">No upcoming expiries detected.</div>}</div></section></>
}
