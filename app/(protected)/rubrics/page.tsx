'use client'
import { CrudModule } from '@/components/CrudModule'
export default function Page(){return <CrudModule title="Observation rubrics" eyebrow="Teaching quality framework" description="Standardize classroom observations across preparation, knowledge, management, engagement, assessment and resources." table="observation_rubrics" leadershipOnly fields={[
{name:'name',label:'RUBRIC NAME',required:true},{name:'description',label:'DESCRIPTION',type:'textarea',required:true},{name:'max_score',label:'MAX SCORE',type:'number',required:true}
]} columns={[{key:'name',label:'Rubric'},{key:'description',label:'Description'},{key:'max_score',label:'Max score'},{key:'active',label:'Active'}]}/>}