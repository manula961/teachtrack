'use client'
import { useEffect,useState } from 'react'
export function useSchoolContext(){
 const[academicYear,setAcademicYear]=useState('2026'),[term,setTerm]=useState('All terms')
 useEffect(()=>{
  setAcademicYear(localStorage.getItem('tt-academic-year')||'2026');setTerm(localStorage.getItem('tt-term')||'All terms')
  const fn=(e:any)=>{setAcademicYear(String(e.detail?.academicYear||'2026'));setTerm(String(e.detail?.term||'All terms'))}
  window.addEventListener('tt-context',fn);return()=>window.removeEventListener('tt-context',fn)
 },[])
 return{academicYear,term}
}
export function inSchoolContext(row:any,academicYear:string,term:string,terms:any[]){
 const y=Number(academicYear),explicit=Number(row.academic_year||row.year||0)
 if(explicit&&explicit!==y)return false
 const raw=row.date||row.created_at||row.start_at||row.meeting_at||row.duty_date||row.checkin_date||row.effective_date
 if(!raw)return !explicit||explicit===y
 const d=String(raw).slice(0,10)
 if(!d.startsWith(`${academicYear}-`))return false
 if(term==='All terms')return true
 const t=terms.find((x:any)=>Number(x.academic_year)===y&&String(x.name).toLowerCase()===term.toLowerCase())
 return t?d>=t.start_date&&d<=t.end_date:true
}
