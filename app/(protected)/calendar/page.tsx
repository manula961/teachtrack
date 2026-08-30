'use client'
import { CrudModule } from '@/components/CrudModule'
export default function Page(){return <CrudModule title="School calendar" eyebrow="Calendar & events" description="Term dates, examinations, meetings, training days, sports and school events." table="school_events" leadershipOnly fields={[
{name:'title',label:'TITLE',required:true},{name:'event_type',label:'TYPE',options:['School Event','Exam','Meeting','Training','Sports','Holiday'],required:true},
{name:'start_at',label:'START',type:'datetime-local',required:true},{name:'end_at',label:'END',type:'datetime-local'},
{name:'audience',label:'AUDIENCE',options:['All Staff','Teachers','Leadership','Students']},{name:'location',label:'LOCATION'},{name:'notes',label:'NOTES',type:'textarea'}
]} columns={[{key:'start_at',label:'Start'},{key:'title',label:'Event'},{key:'event_type',label:'Type'},{key:'audience',label:'Audience'},{key:'location',label:'Location'}]}/>}