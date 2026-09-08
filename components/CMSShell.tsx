'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { usePathname,useRouter } from 'next/navigation'
import { ChevronDown,Menu,Search,X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataProvider,useData } from './DataProvider'

const categories=[
 {label:'Overview',items:[['/cms','CMS Overview'],['/cms/users','User Control'],['/dashboard','Command Center'],['/today','Today'],['/action-center','Action Center'],['/notifications','Notifications'],['/search','Global Search'],['/presentation','Presentation Mode']]},
 {label:'Teaching & Timetable',items:[['/teachers','Teacher Profiles'],['/timetable','Timetable'],['/timetable-generator','Generate Class Timetable'],['/substitution-assistant','Substitute Assistant'],['/lessons','Lesson Plans'],['/classes','Classes & Grades'],['/departments','Departments'],['/department-insights','Department Dashboard'],['/department-health','Department Health'],['/subjects','Subjects'],['/duties','Duty Roster'],['/qr-attendance','QR Attendance']]},
 {label:'Performance & Growth',items:[['/teacher-360','Teacher 360°'],['/intelligence','Growth Intelligence'],['/period-compare','Period Comparison'],['/compare','Teacher Comparison'],['/pathway','Development Pathway'],['/goal-checkins','Goal Check-ins'],['/observation-followup','Observation Follow-up'],['/skills-matrix','Skills Matrix'],['/mentoring','Mentoring & Succession'],['/school-goals','School Goals'],['/analytics','Visual Analytics'],['/feedback','Feedback'],['/observations','Observations'],['/rubrics','Observation Rubrics'],['/goals','Goals'],['/plans','Development Plans'],['/plan-progress','Plan Progress'],['/development','Recommendations'],['/achievements','Achievements'],['/leaderboard','Excellence Board'],['/achievement-wall','Achievement Wall']]},
 {label:'Professional Records',items:[['/training','Training & Certifications'],['/documents','Document Vault'],['/evidence','Evidence Attachments'],['/certificate-calendar','Certificate Expiry Calendar'],['/service-history','Service History'],['/milestones','Milestone Timeline'],['/attendance','Attendance & Punctuality'],['/leave','Leave Management'],['/workload','Workload Analytics'],['/workload-fairness','Workload Fairness']]},
 {label:'School Operations',items:[['/calendar','Calendar & Events'],['/calendar-view','Month / Week Calendar'],['/conflicts','Conflict Detection'],['/approvals','Approval Workflows'],['/exams','Exam Duties'],['/meetings','Meetings & Actions'],['/meeting-actions','Action Tracker'],['/organization','Organization Structure'],['/school-promotion','School Year Promotion'],['/terms','Academic Terms'],['/archive','Archive & Backup']]},
 {label:'Reports & Tools',items:[['/portfolio','Printable Portfolio'],['/recognition-cards','Recognition Certificates'],['/report-builder','Report Builder'],['/reports','Reports & Portfolios'],['/data-quality','Data Quality Centre'],['/data-completeness','Data Completeness'],['/exports','Data Export'],['/alerts','Expiry Alerts'],['/notification-preferences','Notification Preferences'],['/help','Help Center'],['/security','Audit & Security'],['/settings','Appearance & Language']]}
] as const

function CmsInner({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter()
 const{profile,role,data}=useData()
 const[palette,setPalette]=useState(false),[q,setQ]=useState(''),[lang,setLang]=useState('English'),[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState(0)

 const translations:any={
  Sinhala:{'Overview':'දළ විශ්ලේෂණය','Teaching & Timetable':'ඉගැන්වීම හා කාලසටහන','Performance & Growth':'කාර්යසාධනය හා සංවර්ධනය','Professional Records':'වෘත්තීය වාර්තා','School Operations':'පාසල් මෙහෙයුම්','Reports & Tools':'වාර්තා හා මෙවලම්','Notifications':'දැනුම්දීම්','Timetable':'කාලසටහන','Lesson Plans':'පාඩම් සැලසුම්','Classes & Grades':'පන්ති හා ශ්‍රේණි','Departments':'අංශ','Attendance & Punctuality':'පැමිණීම හා වේලාව','Leave Management':'නිවාඩු කළමනාකරණය','Calendar & Events':'දිනදර්ශනය හා සිදුවීම්','Academic Terms':'අධ්‍යයන වාර','Reports & Portfolios':'වාර්තා හා ගොනු','Appearance & Language':'පෙනුම හා භාෂාව'},
  Tamil:{'Overview':'மேலோட்டம்','Teaching & Timetable':'கற்பித்தல் & நேர அட்டவணை','Performance & Growth':'செயல்திறன் & வளர்ச்சி','Professional Records':'தொழில்முறை பதிவுகள்','School Operations':'பள்ளி செயல்பாடுகள்','Reports & Tools':'அறிக்கைகள் & கருவிகள்','Notifications':'அறிவிப்புகள்','Timetable':'நேர அட்டவணை','Lesson Plans':'பாடத் திட்டங்கள்','Classes & Grades':'வகுப்புகள் & தரங்கள்','Departments':'துறைகள்','Attendance & Punctuality':'வருகை & நேர்த்தி','Leave Management':'விடுப்பு மேலாண்மை','Calendar & Events':'நாட்காட்டி & நிகழ்வுகள்','Academic Terms':'கல்விக் காலங்கள்','Reports & Portfolios':'அறிக்கைகள் & தொகுப்புகள்','Appearance & Language':'தோற்றம் & மொழி'}
 }
 const tx=(v:string)=>translations[lang]?.[v]||v
 const roleLabel=role==='principal'?'Principal':role==='vice_principal'?'Vice Principal':role==='section_head'?'Section Head':role==='reviewer'?'Reviewer':'Teacher'
 const managementOnly=new Set(['/cms/users','/compare','/department-insights','/department-health','/workload-fairness','/skills-matrix','/school-goals','/report-builder','/security','/school-promotion','/demo-reset'])
 const visibleCategories=categories.map(cat=>({...cat,items:cat.items.filter(([href])=>{
  if(href==='/cms/users')return ['principal','vice_principal'].includes(role)
  if(role==='teacher'&&managementOnly.has(href))return false
  return true
 })}))
 const flat=visibleCategories.flatMap(c=>c.items.map(i=>({href:i[0],label:i[1],category:c.label})))
 const teachers=(data.teachers_dashboard||[]).map((t:any)=>({href:`/teacher-360?teacher=${t.id}`,label:t.name,category:`Teacher · ${t.teacher_code||`ID ${t.id}`}`}))
 const results=[...flat,...teachers].filter(x=>`${x.label} ${x.category}`.toLowerCase().includes(q.toLowerCase())).slice(0,14)

 useEffect(()=>setSelected(0),[q,palette])

 function paletteKey(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowDown'){e.preventDefault();setSelected(i=>Math.min(results.length-1,i+1))}
  else if(e.key==='ArrowUp'){e.preventDefault();setSelected(i=>Math.max(0,i-1))}
  else if(e.key==='Enter'&&results[selected]){
   e.preventDefault();setPalette(false);router.push(results[selected].href)
  }
 }

 async function signout(){await createClient().auth.signOut();router.replace('/cms/login');router.refresh()}

 useEffect(()=>{
  const savedLang=localStorage.getItem('tt-language')||'English'
  setLang(savedLang);document.documentElement.dataset.language=savedLang
  document.documentElement.dataset.theme=localStorage.getItem('tt-theme')||'light'
 },[])

 useEffect(()=>{
  setMobileOpen(false);setPalette(false)
 },[path])

 useEffect(()=>{
  const fn=(e:KeyboardEvent)=>{
   const el=e.target as HTMLElement
   const typing=['INPUT','TEXTAREA','SELECT'].includes(el?.tagName)
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPalette(v=>!v);setMobileOpen(false)}
   else if(e.key==='/'&&!typing){e.preventDefault();setPalette(true);setMobileOpen(false)}
   else if(e.key==='Escape'){setPalette(false);setMobileOpen(false)}
  }
  window.addEventListener('keydown',fn)
  return()=>window.removeEventListener('keydown',fn)
 },[])

 return <div className="app-layout cms-layout">
  <aside className={`sidebar cms-sidebar ${mobileOpen?'mobile-open':''}`}>
   <div className="mobile-sidebar-head"><span>Management navigation</span><button className="icon-btn" onClick={()=>setMobileOpen(false)} aria-label="Close CMS navigation"><X size={18}/></button></div>
   <Link className="brand sidebar-brand" href="/cms"><span className="brand-mark"/><span><strong>TeachTrack CMS</strong><small>PRIVATE MANAGEMENT</small></span></Link>
   <button className="sidebar-search" title="Search" aria-label="Search CMS and school features" onClick={()=>{setPalette(true);setMobileOpen(false)}}><Search size={15}/><span>Search</span><kbd>⌘K</kbd></button>
   <nav className="side-nav categorized-nav" aria-label="CMS navigation">
    {visibleCategories.map(cat=>{const active=cat.items.some(i=>path===i[0]);return <details key={cat.label} className="nav-category" open={active}>
      <summary title={tx(cat.label)}>{tx(cat.label)}<ChevronDown size={14}/></summary>
      <div className="nav-category-items">{cat.items.map(([href,label])=><Link key={href} href={href} title={tx(label)} className={path===href?'active':''}><span className="side-dot"/>{tx(label)}</Link>)}</div>
    </details>})}
   </nav>
   <div className="sidebar-user"><div className="userbox"><div className="avatar">{(profile?.full_name||'T').slice(0,1).toUpperCase()}</div><div className="sidebar-user-copy"><b>{profile?.full_name||'Teacher'}</b><small>{roleLabel}</small></div></div><button className="btn sidebar-signout" onClick={signout}>Sign out</button></div>
  </aside>

  {mobileOpen&&<button className="mobile-scrim" aria-label="Close CMS navigation" onClick={()=>setMobileOpen(false)}/>}

  <div className="app-content cms-app-content">
   <header className="cms-mobile-bar">
    <button className="icon-btn" onClick={()=>setMobileOpen(true)} aria-label="Open CMS navigation"><Menu size={19}/></button>
    <div><b>TeachTrack CMS</b><small>{roleLabel}</small></div>
    <button className="icon-btn" onClick={()=>{setPalette(true);setMobileOpen(false)}} aria-label="Search CMS"><Search size={18}/></button>
   </header>
   <main id="main-content" className="main">{children}</main>
  </div>

  {palette&&<div className="command-palette-backdrop cms-palette-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setPalette(false)}}>
   <div className="command-palette cms-command-palette" role="dialog" aria-modal="true" aria-label="CMS search">
    <div className="cms-palette-head">
     <span className="cms-palette-kicker">MANAGEMENT SEARCH</span>
     <button className="cms-palette-close" onClick={()=>setPalette(false)} aria-label="Close CMS search"><X size={17}/></button>
    </div>
    <div className="palette-input cms-palette-input">
     <Search size={18}/>
     <input autoFocus value={q} onKeyDown={paletteKey} onChange={e=>setQ(e.target.value)} placeholder="Search features, teachers or teacher code…" aria-label="Search CMS"/>
     <kbd>ESC</kbd>
    </div>
    <div className="cms-palette-meta"><span>{q?`${results.length} result${results.length===1?'':'s'}`:'Start typing to search the school workspace'}</span><span><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span></div>
    <div className="palette-results cms-palette-results">
     {results.map((r,i)=><Link href={r.href} className={i===selected?'selected':''} aria-current={i===selected?'true':undefined} key={`${r.href}-${r.label}-${i}`} onMouseEnter={()=>setSelected(i)} onClick={()=>setPalette(false)}>
      <span className="cms-result-icon">{r.category.startsWith('Teacher')?'T':r.label.slice(0,1).toUpperCase()}</span>
      <span className="cms-result-copy"><b>{r.label}</b><small>{r.category}</small></span>
      <span className="cms-result-arrow">→</span>
     </Link>)}
    </div>
    {q&&!results.length&&<div className="empty compact cms-palette-empty"><Search size={20}/><b>No matches found</b><span>Try a feature name, teacher name, code, or department.</span></div>}
   </div>
  </div>}
 </div>
}
export function CMSShell({children}:{children:React.ReactNode}){return <DataProvider><CmsInner>{children}</CmsInner></DataProvider>}
