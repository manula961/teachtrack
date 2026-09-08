'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { usePathname,useRouter } from 'next/navigation'
import {
  Bell,ChevronDown,ChevronLeft,Clock3,Globe2,Heart,HelpCircle,Home,Menu,
  MoreHorizontal,Plus,RefreshCw,Search,Settings,UserRound,Wifi,WifiOff,X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { composite,derivedAlerts } from '@/lib/teacherInsights'
import { completeness,dataFreshness,teacherById,workloadScore } from '@/lib/advancedUx'
import { DataProvider,useData } from './DataProvider'

const categories=[
 {label:'Overview',items:[['/dashboard','Command Center'],['/today','Today'],['/action-center','Action Center'],['/my-hub','My Professional Hub'],['/notifications','Smart Notifications'],['/search','Smart Search'],['/presentation','Presentation Mode']]},
 {label:'Teaching & Timetable',items:[['/teachers','Teacher Profiles'],['/timetable','Timetable'],['/timetable-generator','Generate Class Timetable'],['/substitution-assistant','Substitute Assistant'],['/lessons','Lesson Plans'],['/classes','Classes & Grades'],['/departments','Departments'],['/department-insights','Department Dashboard'],['/department-health','Department Health'],['/subjects','Subjects'],['/duties','Duty Roster'],['/qr-attendance','QR Attendance']]},
 {label:'Performance & Growth',items:[['/teacher-360','Teacher 360°'],['/intelligence','Growth Intelligence'],['/period-compare','Period Comparison'],['/compare','Teacher Comparison'],['/pathway','Development Pathway'],['/goal-checkins','Goal Check-ins'],['/observation-followup','Observation Follow-up'],['/skills-matrix','Skills Matrix'],['/mentoring','Mentoring & Succession'],['/school-goals','School Goals'],['/analytics','Visual Analytics'],['/feedback','Feedback'],['/observations','Observations'],['/rubrics','Observation Rubrics'],['/goals','Goals'],['/plans','Development Plans'],['/plan-progress','Plan Progress'],['/development','Recommendations'],['/achievements','Achievements'],['/leaderboard','Excellence Board'],['/achievement-wall','Achievement Wall']]},
 {label:'Professional Records',items:[['/training','Training & Certifications'],['/documents','Document Vault'],['/evidence','Evidence Attachments'],['/certificate-calendar','Certificate Expiry Calendar'],['/service-history','Service History'],['/milestones','Milestone Timeline'],['/attendance','Attendance & Punctuality'],['/leave','Leave Management'],['/workload','Workload Analytics'],['/workload-fairness','Workload Fairness']]},
 {label:'School Operations',items:[['/calendar','Calendar & Events'],['/calendar-view','Month / Week Calendar'],['/conflicts','Conflict Detection'],['/approvals','Approval Workflows'],['/exams','Exam Duties'],['/meetings','Meetings & Actions'],['/meeting-actions','Action Tracker'],['/organization','Organization Structure'],['/school-promotion','School Year Promotion'],['/terms','Academic Terms'],['/archive','Archive & Backup']]},
 {label:'Reports & Tools',items:[['/portfolio','Printable Portfolio'],['/recognition-cards','Recognition Certificates'],['/report-builder','Report Builder'],['/reports','Reports & Portfolios'],['/data-quality','Data Quality Centre'],['/data-completeness','Data Completeness'],['/exports','Data Export'],['/alerts','Expiry Alerts'],['/notification-preferences','Notification Preferences'],['/drafts','Saved Drafts'],['/recent','Recently Viewed'],['/favorites','Favorites'],['/demo-reset','Demo Reset'],['/help','Help Center'],['/security','Audit & Security'],['/settings','Appearance & Language']]}
] as const

const routeLabels:Record<string,string>=Object.fromEntries(categories.flatMap(c=>c.items.map(([href,label])=>[href,label])))

function Inner({children}:{children:React.ReactNode}){
 const path=usePathname();const router=useRouter();const {profile,role,data}=useData()
 const [palette,setPalette]=useState(false),[q,setQ]=useState(''),[lang,setLang]=useState('English')
 const [mobileOpen,setMobileOpen]=useState(false),[quickOpen,setQuickOpen]=useState(false),[noticeOpen,setNoticeOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false)
 const [online,setOnline]=useState(true),[toast,setToast]=useState(''),[favorites,setFavorites]=useState<string[]>([]),[recent,setRecent]=useState<{href:string,label:string}[]>([])
 const [installPrompt,setInstallPrompt]=useState<any>(null),[quickTeacherId,setQuickTeacherId]=useState<string>('')
 const [academicYear,setAcademicYear]=useState('2026'),[term,setTerm]=useState('All terms'),[sessionWarning,setSessionWarning]=useState(false)
 const translations:any={
  Sinhala:{'Overview':'දළ විශ්ලේෂණය','Teaching & Timetable':'ඉගැන්වීම හා කාලසටහන','Performance & Growth':'කාර්යසාධනය හා සංවර්ධනය','Professional Records':'වෘත්තීය වාර්තා','School Operations':'පාසල් මෙහෙයුම්','Reports & Tools':'වාර්තා හා මෙවලම්','Command Center':'නායකත්ව පුවරුව','Today':'අද','My Professional Hub':'මගේ වෘත්තීය මධ්‍යස්ථානය','Teacher 360°':'ගුරු 360°','Timetable':'කාලසටහන','Lesson Plans':'පාඩම් සැලසුම්','Departments':'අංශ','Attendance & Punctuality':'පැමිණීම හා වේලාව','Leave Management':'නිවාඩු කළමනාකරණය','Calendar & Events':'දිනදර්ශනය හා සිදුවීම්','Academic Terms':'අධ්‍යයන වාර','Appearance & Language':'පෙනුම හා භාෂාව'},
  Tamil:{'Overview':'மேலோட்டம்','Teaching & Timetable':'கற்பித்தல் & நேர அட்டவணை','Performance & Growth':'செயல்திறன் & வளர்ச்சி','Professional Records':'தொழில்முறை பதிவுகள்','School Operations':'பள்ளி செயல்பாடுகள்','Reports & Tools':'அறிக்கைகள் & கருவிகள்','Command Center':'தலைமை மையம்','Today':'இன்று','My Professional Hub':'என் தொழில்முறை மையம்','Teacher 360°':'ஆசிரியர் 360°','Timetable':'நேர அட்டவணை','Lesson Plans':'பாடத் திட்டங்கள்','Departments':'துறைகள்','Attendance & Punctuality':'வருகை & நேர்த்தி','Leave Management':'விடுப்பு மேலாண்மை','Calendar & Events':'நாட்காட்டி & நிகழ்வுகள்','Academic Terms':'கல்விக் காலங்கள்','Appearance & Language':'தோற்றம் & மொழி'}
 }
 const tx=(v:string)=>translations[lang]?.[v]||v
 const roleLabel=role==='principal'?'Principal':role==='vice_principal'?'Vice Principal':role==='section_head'?'Section Head':role==='reviewer'?'Reviewer':'Teacher'
 const managementOnly=new Set(['/compare','/department-insights','/department-health','/workload-fairness','/skills-matrix','/school-goals','/report-builder','/security','/school-promotion','/demo-reset'])
 type NavItem = readonly [string, string]
 const visibleCategories = categories.map(c => ({
  ...c,
  items: c.items
   .filter(i => role !== 'teacher' || !managementOnly.has(i[0]))
   .map((i): NavItem =>
    i[0] === '/my-hub' && role !== 'teacher'
     ? [i[0], 'Leadership Hub']
     : i
   )
 }))
 const flat=visibleCategories.flatMap(c=>c.items.map(i=>({href:i[0],label:i[1],category:c.label})))
 const teachers=(data.teachers_dashboard||[]).map((t:any)=>({href:`/teacher-360?teacher=${t.id}`,label:t.name,category:`Teacher · ${t.teacher_code||`ID ${t.id}`}`}))
 const results=[...flat,...teachers].filter(x=>`${x.label} ${x.category}`.toLowerCase().includes(q.toLowerCase())).slice(0,14)
 const smart=derivedAlerts(data)
 const notificationPrefs=(data.notification_preferences||[])[0]||{}
 const allowedNotification=(n:any)=>{
  if(n.priority==='High')return true
  const c=String(n.category||'General').toLowerCase()
  const key=c.includes('train')?'training':c.includes('observ')?'observations':c.includes('goal')?'goals':c.includes('timetable')||c.includes('substitut')?'timetable':c.includes('achiev')?'achievements':'general'
  return notificationPrefs[key]!==false
 }
 const visibleNotifications=(data.notifications||[]).filter(allowedNotification)
 const readIds=new Set((data.notification_reads||[]).filter((r:any)=>r.user_id===profile?.id).map((r:any)=>String(r.notification_id)))
 const unread=visibleNotifications.filter((n:any)=>!readIds.has(String(n.id))).length+smart.length
 const fresh=dataFreshness(data)
 const currentLabel=path==='/my-hub'&&role!=='teacher'?'Leadership Hub':routeLabels[path]||'TeachTrack'
 const isFavorite=favorites.includes(path)

 async function signout(){await createClient().auth.signOut();router.replace('/auth');router.refresh()}
 function toggleFavorite(){
  const next=isFavorite?favorites.filter(x=>x!==path):[...favorites,path]
  setFavorites(next);localStorage.setItem('tt-favorites',JSON.stringify(next))
  setToast(isFavorite?'Removed from favorites':'Added to favorites')
 }
 function changeLanguage(next:string){setLang(next);localStorage.setItem('tt-language',next);document.documentElement.dataset.language=next;setToast(`Language: ${next}`)}
 async function installApp(){if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)}

 useEffect(()=>{
  const savedLang=localStorage.getItem('tt-language')||'English';setLang(savedLang);document.documentElement.dataset.language=savedLang
  document.documentElement.dataset.theme=localStorage.getItem('tt-theme')||'light'
  try{const a=JSON.parse(localStorage.getItem('tt-accessibility')||'{}');document.documentElement.dataset.textSize=a.text||'normal';document.documentElement.dataset.contrast=String(Boolean(a.contrast));document.documentElement.dataset.motion=a.motion?'reduced':'full';document.documentElement.dataset.density=a.density||'comfortable'}catch{}
  try{setFavorites(JSON.parse(localStorage.getItem('tt-favorites')||'[]'));setRecent(JSON.parse(localStorage.getItem('tt-recent')||'[]'))}catch{}
  setAcademicYear(localStorage.getItem('tt-academic-year')||'2026');setTerm(localStorage.getItem('tt-term')||'All terms')
  setOnline(navigator.onLine)
  const on=()=>setOnline(true),off=()=>setOnline(false)
  const beforeInstall=(e:any)=>{e.preventDefault();setInstallPrompt(e)}
  const toastEvent=(e:any)=>{setToast(e.detail?.message||'Done')}
  const teacherQuick=(e:any)=>setQuickTeacherId(String(e.detail?.teacherId||''))
  window.addEventListener('online',on);window.addEventListener('offline',off);window.addEventListener('beforeinstallprompt',beforeInstall);window.addEventListener('tt-toast',toastEvent);window.addEventListener('tt-teacher-quick',teacherQuick)
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);window.removeEventListener('beforeinstallprompt',beforeInstall);window.removeEventListener('tt-toast',toastEvent);window.removeEventListener('tt-teacher-quick',teacherQuick)}
 },[])

 useEffect(()=>{
  const base=path.split('?')[0],label=routeLabels[base]||base.replace('/','')||'Home'
  const current={href:path,label};let saved:{href:string,label:string}[]=[]
  try{saved=JSON.parse(localStorage.getItem('tt-recent')||'[]')}catch{}
  const next=[current,...saved.filter(x=>x.href!==current.href)].slice(0,12)
  localStorage.setItem('tt-recent',JSON.stringify(next));setRecent(next)
  setMobileOpen(false);setNoticeOpen(false);setProfileOpen(false);setQuickOpen(false)
 },[path])

 useEffect(()=>{
  if(!toast)return;const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)
 },[toast])

 useEffect(()=>{
  const outside=(e:PointerEvent)=>{
   const target=e.target as Element|null
   if(target?.closest('.topbar-menu'))return
   setNoticeOpen(false);setProfileOpen(false)
  }
  document.addEventListener('pointerdown',outside)
  return()=>document.removeEventListener('pointerdown',outside)
 },[])

 useEffect(()=>{
  if(noticeOpen)requestAnimationFrame(()=>{(document.querySelector('.notification-popover a, .notification-popover button') as HTMLElement|null)?.focus()})
  if(profileOpen)requestAnimationFrame(()=>{(document.querySelector('.profile-popover a, .profile-popover button') as HTMLElement|null)?.focus()})
 },[noticeOpen,profileOpen])

 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined
  const client=createClient()
  function arm(session:any){
   if(timer)clearTimeout(timer)
   if(!session?.expires_at)return
   const ms=session.expires_at*1000-Date.now()-5*60*1000
   timer=setTimeout(()=>setSessionWarning(true),Math.max(1000,ms))
  }
  client.auth.getSession().then(({data})=>arm(data.session))
  const {data:listener}=client.auth.onAuthStateChange((_event,session)=>arm(session))
  return()=>{if(timer)clearTimeout(timer);listener.subscription.unsubscribe()}
 },[])

 function setContext(year:string,nextTerm:string){
  setAcademicYear(year);setTerm(nextTerm);localStorage.setItem('tt-academic-year',year);localStorage.setItem('tt-term',nextTerm)
  window.dispatchEvent(new CustomEvent('tt-context',{detail:{academicYear:year,term:nextTerm}}))
 }
 async function continueSession(){await createClient().auth.refreshSession();setSessionWarning(false);setToast('Session refreshed')}

 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const el=e.target as HTMLElement
   const typing=['INPUT','TEXTAREA','SELECT'].includes(el?.tagName)
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPalette(v=>!v)}
   else if(e.key==='/'&&!typing){e.preventDefault();setPalette(true)}
   else if(e.key.toLowerCase()==='n'&&!typing){e.preventDefault();setQuickOpen(true)}
   else if(e.key==='Escape'){setPalette(false);setQuickOpen(false);setNoticeOpen(false);setProfileOpen(false);setMobileOpen(false)}
  }
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[])

 useEffect(()=>{
  let dirty=false
  const mark=(e:Event)=>{const el=e.target as HTMLElement;if(el.closest('form')&&!el.closest('.palette-input')&&!el.closest('.global-search'))dirty=true}
  const clear=()=>{dirty=false}
  const before=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}}
  document.addEventListener('input',mark);document.addEventListener('change',mark);document.addEventListener('submit',clear);document.addEventListener('reset',clear);window.addEventListener('beforeunload',before)
  return()=>{document.removeEventListener('input',mark);document.removeEventListener('change',mark);document.removeEventListener('submit',clear);document.removeEventListener('reset',clear);window.removeEventListener('beforeunload',before)}
 },[])

 useEffect(()=>{
  const selector='button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
  function focusDialog(){
   const dialog=document.querySelector('[role="dialog"]') as HTMLElement|null
   if(dialog&&!dialog.contains(document.activeElement)){const first=dialog.querySelector(selector) as HTMLElement|null;first?.focus()}
  }
  const observer=new MutationObserver(focusDialog);observer.observe(document.body,{childList:true,subtree:true})
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const dialog=document.querySelector('[role="dialog"]') as HTMLElement|null;if(!dialog)return;const items=[...dialog.querySelectorAll(selector)].filter((x:any)=>!x.disabled) as HTMLElement[];if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  document.addEventListener('keydown',trap);return()=>{observer.disconnect();document.removeEventListener('keydown',trap)}
 },[])

 const quickActions=role==='teacher'
 ? [['/lessons','Lesson plan'],['/leave','Request leave'],['/training','Training'],['/goals','Development goal'],['/achievements','Achievement']]
 : [['/teachers','Teacher'],['/attendance','Attendance'],['/lessons','Lesson plan'],['/training','Training'],['/goals','Development goal'],['/calendar','School event']]

 const crumbs=path.split('/').filter(Boolean).map((part,i,arr)=>({label:i===arr.length-1?currentLabel:part.replace(/-/g,' '),href:'/'+arr.slice(0,i+1).join('/')}))

 return <div className="app-layout">
  <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
   <div className="mobile-sidebar-head"><span>Navigation</span><button className="icon-btn" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
   <Link className="brand sidebar-brand" href="/dashboard"><span className="brand-mark"/><span><strong>TeachTrack</strong><small>DEVELOPMENT CENTER</small></span></Link>
   <button className="sidebar-search" title="Search" aria-label="Search" onClick={()=>setPalette(true)}><Search size={15}/><span>Search</span><kbd>⌘K</kbd></button>
   <nav className="side-nav categorized-nav">
    {visibleCategories.map(cat=>{const active=cat.items.some(i=>path===i[0]);return <details key={cat.label} className="nav-category" open={active}>
      <summary title={tx(cat.label)}>{tx(cat.label)}<ChevronDown size={14}/></summary>
      <div className="nav-category-items">{cat.items.map(([href,label])=><Link key={href} href={href} title={tx(label)} className={path===href?'active':''}><span className="side-dot"/>{tx(label)}</Link>)}</div>
    </details>})}
   </nav>
   <div className="sidebar-user"><div className="userbox"><div className="avatar">{(profile?.full_name||'T').slice(0,1).toUpperCase()}</div><div className="sidebar-user-copy"><b>{profile?.full_name||'Teacher'}</b><small>{roleLabel}</small></div></div><button className="btn sidebar-signout" onClick={signout}>Sign out</button></div>
  </aside>
  {mobileOpen&&<button className="mobile-scrim" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}

  <div className="app-content">
   <header className="global-topbar">
    <div className="global-topbar-left"><button className="icon-btn mobile-menu-btn" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={19}/></button><button className="icon-btn back-btn" onClick={()=>router.back()} aria-label="Go back" title="Back"><ChevronLeft size={19}/></button><div className="academic-context"><b>TeachTrack</b><span>{roleLabel}{fresh?` · updated ${new Date(fresh).toLocaleDateString('en-GB',{timeZone:'Asia/Colombo'})}`:''}</span></div><div className="global-context-controls"><select value={academicYear} onChange={e=>setContext(e.target.value,term)} aria-label="Academic year">{['2025','2026','2027'].map(y=><option key={y}>{y}</option>)}</select><select value={term} onChange={e=>setContext(academicYear,e.target.value)} aria-label="Academic term"><option>All terms</option><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div></div>
    <div className="global-topbar-actions">
     <span className={`connection-pill ${online?'online':'offline'}`}>{online?<Wifi size={13}/>:<WifiOff size={13}/>}<span>{online?'Online':'Offline'}</span></span>
     <div className="topbar-menu"><button className="icon-btn" onClick={()=>{setNoticeOpen(v=>!v);setProfileOpen(false)}} aria-label="Notifications" aria-haspopup="dialog" aria-expanded={noticeOpen} title="Notifications"><Bell size={18}/>{unread>0&&<span className="notification-badge">{Math.min(unread,99)}</span>}</button>{noticeOpen&&<div className="popover notification-popover" role="dialog" aria-label="Notifications"><div className="popover-head"><b>Notifications</b><Link href="/notifications">View all</Link></div>{visibleNotifications.filter((n:any)=>!readIds.has(String(n.id))).slice(0,3).map((n:any)=><div className="mini-notice" key={`n-${n.id}`}><b>{n.title}</b><small>{n.message}</small></div>)}{smart.slice(0,3).map((a:any,i:number)=><div className="mini-notice" key={`${a.kind}-${i}`}><b>{a.title}</b><small>{a.detail}</small></div>)}{!smart.length&&!visibleNotifications.some((n:any)=>!readIds.has(String(n.id)))&&<div className="empty compact">You're all caught up.</div>}</div>}</div>
     <button className={`icon-btn ${isFavorite?'favorite-active':''}`} onClick={toggleFavorite} title={isFavorite?'Remove favorite':'Add favorite'} aria-label="Toggle favorite"><Heart size={18}/></button>
     <div className="topbar-menu"><button className="profile-chip" aria-haspopup="menu" aria-expanded={profileOpen} onClick={()=>{setProfileOpen(v=>!v);setNoticeOpen(false)}}><span className="avatar mini">{(profile?.full_name||'T').slice(0,1).toUpperCase()}</span><span className="profile-chip-copy"><b>{profile?.full_name?.split(' ')[0]||'Teacher'}</b><small>{roleLabel}</small></span><ChevronDown size={14}/></button>{profileOpen&&<div className="popover profile-popover" role="menu" aria-label="Account menu"><Link href="/my-hub" role="menuitem"><UserRound size={16}/> My profile</Link><Link href="/favorites" role="menuitem"><Heart size={16}/> Favorites</Link><Link href="/drafts" role="menuitem"><MoreHorizontal size={16}/> Saved drafts</Link><Link href="/recent" role="menuitem"><MoreHorizontal size={16}/> Recently viewed</Link><Link href="/settings" role="menuitem"><Settings size={16}/> Appearance</Link><Link href="/notification-preferences" role="menuitem"><Bell size={16}/> Notification preferences</Link><Link href="/help" role="menuitem"><HelpCircle size={16}/> Help</Link><div className="language-row"><Globe2 size={15}/>{['English','Sinhala','Tamil'].map(x=><button key={x} className={lang===x?'active':''} onClick={()=>changeLanguage(x)}>{x.slice(0,2).toUpperCase()}</button>)}</div>{installPrompt&&<button className="popover-action" role="menuitem" onClick={installApp}>Install TeachTrack</button>}<button className="popover-action danger" role="menuitem" onClick={signout}>Sign out</button></div>}</div>
    </div>
   </header>
   <div className="breadcrumb-bar"><nav aria-label="Breadcrumb"><Link href="/dashboard">Home</Link>{crumbs.filter(c=>c.href!=='/dashboard').map((c,i)=><span key={c.href}><span className="crumb-sep">›</span>{c.href===path?<b>{c.label}</b>:<Link href={c.href}>{c.label}</Link>}</span>)}</nav><div className="page-shortcuts"><button onClick={()=>setPalette(true)}><Search size={14}/> Search <kbd>/</kbd></button><button onClick={()=>setQuickOpen(true)}><Plus size={14}/> Quick add <kbd>N</kbd></button></div></div>
   <main id="main-content" className="main">{children}</main>
  </div>

  <Link href="/help" className="help-bubble" aria-label="Help" title="Help"><HelpCircle size={20}/></Link>

  <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
   <Link href="/dashboard" className={path==='/dashboard'?'active':''}><Home size={18}/><span>Home</span></Link>
   <Link href="/today" className={path==='/today'?'active':''}><Bell size={18}/><span>Today</span></Link>
   <button onClick={()=>setQuickOpen(true)} className="mobile-add"><Plus size={22}/><span>Add</span></button>
   <button onClick={()=>setPalette(true)}><Search size={18}/><span>Search</span></button>
   <Link href="/my-hub" className={path==='/my-hub'?'active':''}><UserRound size={18}/><span>Me</span></Link>
  </nav>

  {quickOpen&&<div className="command-palette-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setQuickOpen(false)}}><div className="quick-add-sheet"><div className="panel-head"><div><small>QUICK ADD</small><h2>Create something</h2><p>Available actions match your role.</p></div><button className="icon-btn" onClick={()=>setQuickOpen(false)} aria-label="Close Quick Add"><X size={18}/></button></div><div className="quick-action-grid">{quickActions.map(([href,label])=><Link href={href} key={href} className="quick-action-card" onClick={()=>setQuickOpen(false)}><Plus size={18}/><b>{label}</b><span>Open module →</span></Link>)}</div></div></div>}

  {palette&&<div className="command-palette-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setPalette(false)}}><div className="command-palette"><div className="palette-input"><Search size={18}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search features, teachers, teacher code…"/><button onClick={()=>setPalette(false)} aria-label="Close search"><X size={16}/></button></div><div className="palette-results">{results.map((r,i)=><Link href={r.href} key={`${r.href}-${r.label}-${i}`} onClick={()=>setPalette(false)}><span><b>{r.label}</b><small>{r.category}</small></span><span>→</span></Link>)}</div>{q&&!results.length&&<div className="empty compact">No matching feature or teacher.</div>}</div></div>}
  {quickTeacherId&&(()=>{const t=teacherById(data,quickTeacherId);if(!t)return null;const c=composite(data,t),w=workloadScore(data,t.id),cp=completeness(data,t);return <><button className="drawer-scrim" aria-label="Close teacher quick view" onClick={()=>setQuickTeacherId('')}/><aside className="teacher-quick-drawer" role="dialog" aria-modal="true" aria-label={`Teacher quick view for ${t.name}`}><div className="panel-head"><div><small>{t.teacher_code||`ID ${t.id}`}</small><h2>{t.name}</h2><p>{t.subject} · {t.department}</p></div><button className="icon-btn" onClick={()=>setQuickTeacherId('')} aria-label="Close teacher quick view"><X size={18}/></button></div><div className="kpis quick-card-kpis"><div className="kpi"><small>PERFORMANCE</small><b>{c.score}%</b><span>Composite</span></div><div className="kpi"><small>WORKLOAD</small><b>{w.total}</b><span>Responsibilities</span></div><div className="kpi"><small>COMPLETE</small><b>{cp.score}%</b><span>Evidence</span></div></div><div className="teacher-quick-sections"><div className="metric"><span>Section</span><b>{t.section||'—'}</b></div><div className="metric"><span>Experience</span><b>{t.experience||0} years</b></div><div className="metric"><span>Qualification</span><b>{t.qualification||'—'}</b></div></div><div className="cms-actions"><Link className="cms-action" href={`/teacher-360?teacher=${t.id}`}><b>Open 360°</b><span>Full evidence timeline →</span></Link><Link className="cms-action" href="/timetable"><b>Timetable</b><span>Teaching schedule →</span></Link><Link className="cms-action" href={`/portfolio?teacher=${t.id}`}><b>Portfolio</b><span>Printable report →</span></Link></div></aside></>})()}
  {sessionWarning&&<div className="session-warning" role="alert"><Clock3 size={18}/><div><b>Session expires soon</b><small>Refresh now to protect unsaved work.</small></div><button className="btn btn-primary" onClick={continueSession}><RefreshCw size={14}/> Continue session</button></div>}
  {toast&&<div className="global-toast" role="status">{toast}</div>}
 </div>
}
export function AppShell({children}:{children:React.ReactNode}){return <DataProvider><Inner>{children}</Inner></DataProvider>}
