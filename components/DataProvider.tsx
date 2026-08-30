'use client'
import { createContext,useCallback,useContext,useEffect,useMemo,useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AnyRow=Record<string,any>
type Store={
 loading:boolean
 profile:AnyRow|null
 role:string
 data:Record<string,AnyRow[]>
 dataErrors:Record<string,string>
 refresh:()=>Promise<void>
 insert:(table:string,payload:AnyRow)=>Promise<void>
 update:(table:string,id:number,payload:AnyRow)=>Promise<void>
 remove:(table:string,id:number)=>Promise<void>
}

const Ctx=createContext<Store|null>(null)
const tables=['teachers_dashboard','attendance','training','feedback','lessons','achievements','goals','observations','development_recommendations','activity_logs','school_periods','timetable_classes','timetable_entries','timetable_substitutions','leave_requests','school_events','exam_responsibilities','teacher_documents','development_plans','observation_rubrics','observation_scores','notifications','academic_terms','departments','school_org_units','teacher_service_history','duty_roster','staff_meetings','meeting_actions','qr_attendance_sessions','qr_attendance_checkins','school_archives','subjects','login_events','profiles','class_subject_requirements','approval_workflows','approval_requests','approval_actions','school_year_promotions','goal_checkins','evidence_attachments','notification_reads','notification_preferences','school_goals','mentoring_pairs','mentoring_sessions','teacher_skill_evidence','observation_followups','saved_report_presets']

export function DataProvider({children}:{children:React.ReactNode}){
 const supabase=useMemo(()=>createClient(),[])
 const[loading,setLoading]=useState(true)
 const[profile,setProfile]=useState<AnyRow|null>(null)
 const[data,setData]=useState<Record<string,AnyRow[]>>({})
 const[dataErrors,setDataErrors]=useState<Record<string,string>>({})

 const refresh=useCallback(async()=>{
  setLoading(true)
  const {data:{user},error:userError}=await supabase.auth.getUser()
  if(userError||!user){
   setProfile(null);setData({});setDataErrors(userError?{auth:userError.message}:{})
   setLoading(false)
   return
  }

  const profileResult=await supabase.from('profiles').select('*').eq('id',user.id).single()
  if(profileResult.error){
   setProfile(null)
   setDataErrors({profiles:profileResult.error.message})
   setLoading(false)
   return
  }
  setProfile(profileResult.data)

  const out:Record<string,AnyRow[]>={}
  const errors:Record<string,string>={}
  await Promise.all(tables.map(async table=>{
   const result=await supabase.from(table).select('*')
   if(result.error){
    errors[table]=result.error.message
    out[table]=[]
   }else{
    out[table]=result.data||[]
   }
  }))

  setData(out)
  setDataErrors(errors)
  if(Object.keys(errors).length&&typeof window!=='undefined'){
   window.dispatchEvent(new CustomEvent('tt-toast',{detail:{type:'warning',message:`Some school data could not be loaded (${Object.keys(errors).length} source${Object.keys(errors).length===1?'':'s'}).`}}))
  }
  setLoading(false)
 },[supabase])

 useEffect(()=>{refresh()},[refresh])

 async function audit(action:string,entity_type:string,entity_id?:number){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return {ok:false,error:'No authenticated user for audit record.'}
  const result=await supabase.from('activity_logs').insert({
   actor_id:user.id,
   actor_name:profile?.full_name||'User',
   action,
   entity_type,
   entity_id
  })
  if(result.error){
   console.error('TeachTrack audit write failed:',result.error.message)
   if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tt-toast',{detail:{type:'warning',message:'Change saved, but its audit entry could not be recorded.'}}))
   return {ok:false,error:result.error.message}
  }
  return {ok:true,error:''}
 }

 async function insert(table:string,payload:AnyRow){
  const result=await supabase.from(table).insert(payload).select('id').single()
  if(result.error)throw result.error
  await audit('Created '+table,table,result.data?.id)
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tt-toast',{detail:{type:'success',message:'Saved successfully'}}))
  await refresh()
 }

 async function update(table:string,id:number,payload:AnyRow){
  const result=await supabase.from(table).update(payload).eq('id',id)
  if(result.error)throw result.error
  await audit('Updated '+table,table,id)
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tt-toast',{detail:{type:'success',message:'Changes saved'}}))
  await refresh()
 }

 async function remove(table:string,id:number){
  const result=await supabase.from(table).delete().eq('id',id)
  if(result.error)throw result.error
  await audit('Deleted '+table,table,id)
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tt-toast',{detail:{type:'success',message:'Record deleted'}}))
  await refresh()
 }

 return <Ctx.Provider value={{loading,profile,role:profile?.role||'teacher',data,dataErrors,refresh,insert,update,remove}}>{children}</Ctx.Provider>
}

export function useData(){
 const value=useContext(Ctx)
 if(!value)throw new Error('useData must be inside DataProvider')
 return value
}
