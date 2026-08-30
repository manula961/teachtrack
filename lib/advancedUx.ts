import type { Row } from './teacherInsights'
import { composite, performanceTrend, teacherRows } from './teacherInsights'

export function teacherById(data:Record<string,Row[]>,id:any){
  return (data.teachers_dashboard||[]).find((t:Row)=>String(t.id)===String(id))
}
export function teacherLabel(data:Record<string,Row[]>,id:any){
  const t=teacherById(data,id);return t?`${t.teacher_code||`ID ${t.id}`} · ${t.name}`:`Teacher ID ${id}`
}
export function dataFreshness(data:Record<string,Row[]>){
  const dates=Object.values(data).flat().map((r:Row)=>r.updated_at||r.created_at).filter(Boolean).map(String).sort()
  return dates.length?dates[dates.length-1]:null
}
export function completeness(data:Record<string,Row[]>,teacher:Row){
  const own=teacherRows(data,teacher.id)
  const checks=[
    ['Profile',Boolean(teacher.name&&teacher.email&&teacher.subject&&teacher.department)],
    ['Qualification',Boolean(teacher.qualification)],
    ['Skills',Array.isArray(teacher.skills)&&teacher.skills.length>0],
    ['Timetable',own.timetable.length>0],
    ['Development goal',own.goals.length>0],
    ['Recent observation',own.observations.length>0],
    ['Training record',own.training.length>0],
    ['Document evidence',own.documents.length>0],
  ] as [string,boolean][]
  return {score:Math.round(checks.filter(x=>x[1]).length/checks.length*100),checks}
}
export function workloadScore(data:Record<string,Row[]>,teacherId:any){
  const id=String(teacherId)
  const lessons=(data.timetable_entries||[]).filter((x:Row)=>String(x.teacher_id)===id).length
  const duties=(data.duty_roster||[]).filter((x:Row)=>String(x.teacher_id)===id).length
  const subs=(data.timetable_substitutions||[]).filter((x:Row)=>String(x.substitute_teacher_id||x.teacher_id)===id).length
  const exams=(data.exam_responsibilities||[]).filter((x:Row)=>String(x.teacher_id)===id).length
  const total=lessons+duties+subs+exams
  return {lessons,duties,subs,exams,total}
}
export function departmentHealth(data:Record<string,Row[]>,department:any){
  const teachers=(data.teachers_dashboard||[]).filter((t:Row)=>String(t.department||'').toLowerCase()===String(department.name||department).toLowerCase())
  const scores=teachers.map((t:Row)=>composite(data,t).score)
  const avg=scores.length?Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length):0
  const improving=teachers.filter((t:Row)=>performanceTrend(data,t).direction==='Improving').length
  const atRisk=(data.goals||[]).filter((g:Row)=>g.status==='At Risk'&&teachers.some((t:Row)=>String(t.id)===String(g.teacher_id))).length
  const training=(data.training||[]).filter((x:Row)=>teachers.some((t:Row)=>String(t.id)===String(x.teacher_id))).length
  return {teachers,avg,improving,atRisk,training}
}
export function growthStreak(data:Record<string,Row[]>,teacherId:any){
  const id=String(teacherId)
  const dates=[
    ...(data.training||[]).filter((x:Row)=>String(x.teacher_id)===id).map((x:Row)=>x.date||x.created_at),
    ...(data.goal_checkins||[]).filter((x:Row)=>String(x.teacher_id)===id).map((x:Row)=>x.checkin_date||x.created_at),
    ...(data.achievements||[]).filter((x:Row)=>String(x.teacher_id)===id).map((x:Row)=>x.date||x.created_at),
  ].filter(Boolean).map((x:any)=>String(x).slice(0,7))
  const months=[...new Set(dates)].sort().reverse()
  if(!months.length)return 0
  let streak=1
  const ym=(s:string)=>{const[y,m]=s.split('-').map(Number);return y*12+m}
  for(let i=1;i<months.length;i++){if(ym(months[i-1])-ym(months[i])===1)streak++;else break}
  return streak
}
export function supportIndicators(data:Record<string,Row[]>){
  return (data.teachers_dashboard||[]).map((t:Row)=>{
    const c=composite(data,t),trend=performanceTrend(data,t),comp=completeness(data,t)
    const own=teacherRows(data,t.id)
    const reasons:string[]=[]
    if(trend.direction==='Needs attention')reasons.push(`recent evidence ${trend.delta} points`)
    if(c.metrics.find(x=>x.label==='Attendance')!.value<80)reasons.push('attendance below 80%')
    if(own.goals.some((g:Row)=>g.status==='At Risk'))reasons.push('goal marked At Risk')
    if(comp.score<60)reasons.push('profile evidence incomplete')
    return {teacher:t,reasons,score:c.score,trend}
  }).filter(x=>x.reasons.length)
}
