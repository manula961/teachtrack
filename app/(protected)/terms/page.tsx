'use client'
import { CrudModule } from '@/components/CrudModule'
export default function Page(){return <CrudModule title="Academic years & terms" eyebrow="Academic structure" description="Keep each school year and term separated so analytics remain historically accurate." table="academic_terms" leadershipOnly fields={[
{name:'academic_year',label:'YEAR',type:'number',required:true},{name:'name',label:'TERM',options:['Term 1','Term 2','Term 3'],required:true},
{name:'start_date',label:'START DATE',type:'date',required:true},{name:'end_date',label:'END DATE',type:'date',required:true},{name:'status',label:'STATUS',options:['Upcoming','Active','Closed'],required:true}
]} columns={[{key:'academic_year',label:'Year'},{key:'name',label:'Term'},{key:'start_date',label:'Start'},{key:'end_date',label:'End'},{key:'status',label:'Status'}]}/>}