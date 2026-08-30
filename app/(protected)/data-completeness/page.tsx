'use client'
import Link from 'next/link'
import { useData } from '@/components/DataProvider'
import { completeness } from '@/lib/advancedUx'
export default function DataCompleteness(){
 const{data,loading,role}=useData();if(loading)return <div className="loading">Checking data completeness…</div>
 if(!['principal','vice_principal','section_head','reviewer'].includes(role))return <div className="panel empty">Data Completeness is available to school leadership and reviewers.</div>
 const rows=(data.teachers_dashboard||[]).map((t:any)=>({t,...completeness(data,t)})).sort((a:any,b:any)=>a.score-b.score)
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Data quality assistant</span><h1 style={{marginTop:14}}>Teacher evidence completeness</h1><p>See exactly which profile and professional-development evidence is missing.</p></div></div><section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th>Completeness</th><th>Missing evidence</th><th/></tr></thead><tbody>{rows.map((x:any)=><tr key={x.t.id}><td><b>{x.t.name}</b></td><td>{x.score}%</td><td>{x.checks.filter((c:any)=>!c[1]).map((c:any)=>c[0]).join(' · ')||'Complete'}</td><td><Link className="btn" href={`/teacher-360?teacher=${x.t.id}`}>Review</Link></td></tr>)}</tbody></table></div></section></>
}