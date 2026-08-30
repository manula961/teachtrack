'use client'
import { useData } from '@/components/DataProvider'
import { workloadScore } from '@/lib/advancedUx'
export default function WorkloadFairness(){
 const{data,loading,role}=useData();if(loading)return <div className="loading">Balancing workload…</div>
 if(!['principal','vice_principal','section_head','reviewer'].includes(role))return <div className="panel empty">Workload Fairness is available to school leadership and reviewers.</div>
 const rows=(data.teachers_dashboard||[]).map((t:any)=>({...t,...workloadScore(data,t.id)})).sort((a:any,b:any)=>b.total-a.total)
 const avg=rows.length?rows.reduce((s:number,x:any)=>s+x.total,0)/rows.length:0
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Workload fairness</span><h1 style={{marginTop:14}}>Teaching & responsibility balance</h1><p>Compare lessons, duties, substitutions and exam responsibilities before assigning more work.</p></div><span className="status">Average {avg.toFixed(1)}</span></div><section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th>Lessons</th><th>Duties</th><th>Substitutions</th><th>Exams</th><th>Total</th><th>Indicator</th></tr></thead><tbody>{rows.map((x:any)=><tr key={x.id}><td><b>{x.name}</b><small style={{display:'block'}}>{x.teacher_code||`ID ${x.id}`}</small></td><td>{x.lessons}</td><td>{x.duties}</td><td>{x.subs}</td><td>{x.exams}</td><td>{x.total}</td><td>{x.total>avg*1.35?'High':x.total<avg*.65?'Low':'Balanced'}</td></tr>)}</tbody></table></div></section></>
}