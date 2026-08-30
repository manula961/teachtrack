'use client'
import { useData } from '@/components/DataProvider'
import { departmentHealth } from '@/lib/advancedUx'
export default function DepartmentHealth(){
 const{data,loading,role}=useData();if(loading)return <div className="loading">Scoring department health…</div>
 if(!['principal','vice_principal','section_head','reviewer'].includes(role))return <div className="panel empty">Department Health is available to school leadership and reviewers.</div>
 const departments=data.departments||[]
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Department health</span><h1 style={{marginTop:14}}>Development scorecards</h1><p>Attendance/performance context, training participation, improvement and at-risk goals by department.</p></div></div><div className="cards">{departments.map((d:any)=>{const h=departmentHealth(data,d);return <article className="person-card" key={d.id}><h3>{d.name}</h3><div className="metric"><span>Teachers</span><b>{h.teachers.length}</b></div><div className="metric"><span>Avg performance</span><b>{h.avg}%</b></div><div className="metric"><span>Improving</span><b>{h.improving}</b></div><div className="metric"><span>Training records</span><b>{h.training}</b></div><div className="metric"><span>At-risk goals</span><b>{h.atRisk}</b></div></article>})}</div></>
}