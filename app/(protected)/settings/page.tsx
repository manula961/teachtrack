'use client'
import { useEffect,useState } from 'react'
export default function Settings(){
 const[theme,setTheme]=useState('light'),[lang,setLang]=useState('English'),[msg,setMsg]=useState('')
 const[prefs,setPrefs]=useState({calendar:true,quick:true,activity:true})
 const[a11y,setA11y]=useState({text:'normal',contrast:false,motion:false,density:'comfortable'})
 useEffect(()=>{
  setTheme(localStorage.getItem('tt-theme')||'light');setLang(localStorage.getItem('tt-language')||'English')
  try{setPrefs(v=>({...v,...JSON.parse(localStorage.getItem('tt-dashboard')||'{}')}));setA11y(v=>({...v,...JSON.parse(localStorage.getItem('tt-accessibility')||'{}')}))}catch{}
 },[])
 function apply(){
  document.documentElement.dataset.theme=theme;document.documentElement.dataset.language=lang
  document.documentElement.dataset.textSize=a11y.text;document.documentElement.dataset.contrast=String(a11y.contrast)
  document.documentElement.dataset.motion=a11y.motion?'reduced':'full';document.documentElement.dataset.density=a11y.density
 }
 function save(){
  localStorage.setItem('tt-theme',theme);localStorage.setItem('tt-language',lang);localStorage.setItem('tt-dashboard',JSON.stringify(prefs));localStorage.setItem('tt-accessibility',JSON.stringify(a11y));apply();setMsg('Preferences saved.')
 }
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Personalization</span><h1 style={{marginTop:14}}>Appearance, language & accessibility</h1><p>Make TeachTrack comfortable for your role, device and visual preferences.</p></div></div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="grid-2">
  <section className="panel"><div className="panel-head"><div><h2>Interface</h2><p>Stored locally for this browser.</p></div></div><div className="field"><label>APPEARANCE</label><select value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></div><div className="field"><label>UI LANGUAGE</label><select value={lang} onChange={e=>setLang(e.target.value)}><option>English</option><option>Sinhala</option><option>Tamil</option></select></div><div className="field"><label>DISPLAY DENSITY</label><select value={a11y.density} onChange={e=>setA11y(v=>({...v,density:e.target.value}))}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div></section>
  <section className="panel"><div className="panel-head"><div><h2>Accessibility</h2><p>Improve readability and reduce visual distraction.</p></div></div><div className="field"><label>TEXT SIZE</label><select value={a11y.text} onChange={e=>setA11y(v=>({...v,text:e.target.value}))}><option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra large</option></select></div><label className="queue-row" style={{cursor:'pointer'}}><div><b>High contrast</b><small>Strengthen borders and text separation.</small></div><input type="checkbox" checked={a11y.contrast} onChange={e=>setA11y(v=>({...v,contrast:e.target.checked}))}/></label><label className="queue-row" style={{cursor:'pointer',marginTop:8}}><div><b>Reduced motion</b><small>Disable non-essential movement and transitions.</small></div><input type="checkbox" checked={a11y.motion} onChange={e=>setA11y(v=>({...v,motion:e.target.checked}))}/></label></section>
 </div>
 <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h2>Dashboard widgets</h2><p>Show only the information most useful to you.</p></div></div>{[['calendar','Upcoming calendar'],['quick','Quick operations'],['activity','Recent activity']].map(([key,label])=><label key={key} className="queue-row" style={{cursor:'pointer'}}><div><b>{label}</b><small>Toggle this dashboard section</small></div><input type="checkbox" checked={(prefs as any)[key]} onChange={e=>setPrefs(v=>({...v,[key]:e.target.checked}))}/></label>)}</section>
 <div className="toolbar" style={{marginTop:18}}><button className="btn" onClick={apply}>Preview changes</button><button className="btn btn-primary" onClick={save}>Save preferences</button></div></>
}
