'use client'
import {useMemo,useState, Suspense} from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useSearchParams } from 'next/navigation'
import { QrCode,Plus,CheckCircle2 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
function QRAttendanceContent(){
 const {data,loading,role,profile,insert}=useData();const params=useSearchParams();const[code,setCode]=useState(params.get('code')||'');const[msg,setMsg]=useState('')
 const leadership=['principal','vice_principal'].includes(role);const teachers=data.teachers_dashboard||[];const teacher=(id:any)=>teachers.find((t:any)=>String(t.id)===String(id));const sessions=[...(data.qr_attendance_sessions||[])].sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)));const checkins=data.qr_attendance_checkins||[]
 const active=sessions.find((s:any)=>s.active&&new Date(s.closes_at)>new Date())
 async function create(){const token=`TT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;try{await insert('qr_attendance_sessions',{session_date:new Date().toISOString().slice(0,10),code:token,opens_at:new Date().toISOString(),closes_at:new Date(Date.now()+90*60000).toISOString(),active:true});setMsg('QR attendance session opened for 90 minutes.')}catch(e:any){setMsg(e.message)}}
 async function checkin(){const s=sessions.find((x:any)=>String(x.code).toUpperCase()===code.trim().toUpperCase());if(!s)return setMsg('Invalid attendance code.');if(new Date(s.closes_at)<new Date())return setMsg('This attendance session has closed.');if(!profile?.teacher_id)return setMsg('Your account is not linked to a teacher profile.');try{await insert('qr_attendance_checkins',{session_id:s.id,teacher_id:Number(profile.teacher_id)});setMsg('Attendance check-in recorded.')}catch(e:any){setMsg(e.message.includes('duplicate')?'You have already checked in.':e.message)}}
 const qrValue=active&&typeof window!=='undefined'?`${window.location.origin}/qr-attendance?code=${encodeURIComponent(active.code)}`:''
 if(loading)return <div className="loading">Loading QR attendance…</div>
 return <><div className="page-head"><div><span className="eyebrow"><i className="dot"/>Mobile staff attendance</span><h1 style={{marginTop:14}}>QR attendance</h1><p>Leadership opens a short-lived session; teachers scan the QR code or enter its code after signing in.</p></div>{leadership&&<button className="btn btn-primary" onClick={create}><Plus size={16}/> Open session</button>}</div>
 {msg&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{msg}</b></div><i className="pulse"/></div>}
 <div className="grid">{leadership?<section className="panel"><div className="panel-head"><div><h2>Live attendance QR</h2><p>{active?'Session open until '+new Date(active.closes_at).toLocaleTimeString('en-GB',{timeZone:'Asia/Colombo',hour:'2-digit',minute:'2-digit'}):'No active session'}</p></div><span className={`status ${active?'good':''}`}>{active?'Live':'Closed'}</span></div>{active&&<div style={{display:'grid',placeItems:'center',gap:15,padding:25}}><div style={{background:'#fff',padding:16,borderRadius:16,border:'1px solid var(--line)'}}>{qrValue&&<QRCodeSVG value={qrValue} size={220}/>}</div><b>{active.code}</b><small>{checkins.filter((x:any)=>x.session_id===active.id).length} check-in(s)</small><div style={{width:'100%',maxWidth:520}}>{checkins.filter((x:any)=>x.session_id===active.id).slice(-8).reverse().map((x:any)=>{const t=teacher(x.teacher_id);return <div className="metric" key={x.id}><span>{t?.name||'Teacher'}</span><b>{t?.teacher_code||`TCH-${String(x.teacher_id).padStart(4,'0')}`}</b></div>})}</div></div>}</section>:<section className="panel"><div className="panel-head"><div><h2>Teacher check-in</h2><p>Scan the school QR or enter the displayed attendance code.</p></div><QrCode/></div><div className="field"><label>ATTENDANCE CODE</label><input value={code} onChange={e=>setCode(e.target.value)} placeholder="TT-20260828-ABC123"/></div><button className="btn btn-primary" onClick={checkin}><CheckCircle2 size={16}/> Check in</button></section>}
 <section className="panel"><div className="panel-head"><div><h3>Recent sessions</h3><p>QR attendance activity</p></div></div>{sessions.slice(0,8).map((s:any)=><div className="metric" key={s.id}><span>{s.session_date} · {s.code}</span><b>{checkins.filter((x:any)=>x.session_id===s.id).length}</b></div>)}</section></div></>
}

export default function QRAttendance() {
  return (
    <Suspense fallback={<div className="loading">Loading QR attendance…</div>}>
      <QRAttendanceContent />
    </Suspense>
  )
}
