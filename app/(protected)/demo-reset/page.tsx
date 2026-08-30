'use client'
import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
export default function DemoReset(){
 const[msg,setMsg]=useState('')
 function reset(){
  if(!window.confirm('Reset local demo/UI state? This does NOT delete live Supabase school records.'))return
  const keep=['tt-theme','tt-language'];const saved=Object.fromEntries(keep.map(k=>[k,localStorage.getItem(k)]))
  Object.keys(localStorage).filter(k=>k.startsWith('tt-')).forEach(k=>localStorage.removeItem(k))
  keep.forEach(k=>saved[k]&&localStorage.setItem(k,saved[k]!))
  setMsg('Local demo state reset. Live school records were not changed.')
 }
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Safe competition reset</span><h1 style={{marginTop:14}}>Demo state reset</h1><p>Restore navigation, filters, onboarding, favorites and dashboard preferences without risking the live Supabase database.</p></div></div>{msg&&<div className="command"><div><b>{msg}</b></div><i className="pulse"/></div>}<section className="panel" style={{marginTop:18}}><RotateCcw size={32}/><h2>Reset local demonstration state</h2><p>This intentionally does not delete teachers, attendance, feedback, training, timetable or any other school records.</p><button className="btn btn-primary" onClick={reset}>Reset local demo state</button></section></>
}