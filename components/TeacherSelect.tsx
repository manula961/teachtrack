'use client'
import { useData } from './DataProvider'
export function teacherOptions(data:any){return (data.teachers_dashboard||[]).map((t:any)=>({id:t.id,name:t.name}))}
