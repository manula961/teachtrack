'use client'

import { useEffect,useState } from 'react'
import { Check,ChevronDown,ShieldCheck,UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useData } from '@/components/DataProvider'

type Profile={id:string;full_name:string;role:string;teacher_id:number|null;created_at:string}
type MenuPos={top:number;left:number;width:number}

const ROLE_LABEL:Record<string,string>={
 principal:'Principal',
 vice_principal:'Vice Principal',
 section_head:'Section Head',
 reviewer:'Reviewer',
 teacher:'Teacher',
}

export default function UserControlPage(){
 const supabase=createClient()
 const{role,profile}=useData()
 const[users,setUsers]=useState<Profile[]>([])
 const[busy,setBusy]=useState('')
 const[message,setMessage]=useState('')
 const[openUser,setOpenUser]=useState('')
 const[menuPos,setMenuPos]=useState<MenuPos|null>(null)

 const canManage=role==='principal'||role==='vice_principal'
 const options=role==='principal'
  ? ['principal','vice_principal','section_head','reviewer','teacher']
  : ['section_head','reviewer','teacher']

 async function load(){
  const{data,error}=await supabase.from('profiles').select('id,full_name,role,teacher_id,created_at').order('full_name')
  if(error)setMessage(error.message)
  else setUsers((data||[]) as Profile[])
 }
 useEffect(()=>{if(canManage)load()},[canManage])

 useEffect(()=>{
  const outside=(e:PointerEvent)=>{
   const target=e.target as Element|null
   if(target?.closest('.cms-role-trigger')||target?.closest('.cms-role-floating-menu'))return
   setOpenUser('');setMenuPos(null)
  }
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpenUser('');setMenuPos(null)}}
  document.addEventListener('pointerdown',outside)
  window.addEventListener('keydown',key)
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',key)}
 },[])

 useEffect(()=>{
  if(!openUser)return
  requestAnimationFrame(()=>{
   const selected=document.querySelector('.cms-role-floating-menu button[aria-selected="true"]') as HTMLElement|null
   const first=document.querySelector('.cms-role-floating-menu button') as HTMLElement|null
   ;(selected||first)?.focus()
  })
 },[openUser])

 function openPicker(user:Profile,button:HTMLButtonElement){
  if(openUser===user.id){setOpenUser('');setMenuPos(null);return}
  const r=button.getBoundingClientRect()
  const menuHeight=Math.min(options.length*42+12,240)
  const roomBelow=window.innerHeight-r.bottom
  const top=roomBelow>=menuHeight+8?r.bottom+6:Math.max(8,r.top-menuHeight-6)
  const width=Math.max(190,r.width)
  const left=Math.min(Math.max(8,r.left),window.innerWidth-width-8)
  setMenuPos({top,left,width});setOpenUser(user.id)
 }

 function menuKey(e:React.KeyboardEvent<HTMLButtonElement>){
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return
  e.preventDefault()
  const items=[...document.querySelectorAll('.cms-role-floating-menu button')] as HTMLButtonElement[]
  const current=items.indexOf(e.currentTarget)
  const next=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?Math.min(items.length-1,current+1):Math.max(0,current-1)
  items[next]?.focus()
 }

 async function changeRole(user:Profile,newRole:string){
  if(newRole===user.role){setOpenUser('');setMenuPos(null);return}
  setBusy(user.id);setMessage('');setOpenUser('');setMenuPos(null)
  const{error}=await supabase.rpc('set_user_role',{target_user:user.id,new_role:newRole})
  setBusy('')
  if(error){setMessage(error.message);return}
  setMessage(`Updated ${user.full_name||'user'} to ${ROLE_LABEL[newRole]||newRole}.`)
  await load()
 }

 if(!canManage)return <div className="panel"><h2>Access restricted</h2><p>Only the Principal and Vice Principal can manage user permissions.</p></div>

 const openProfile=users.find(u=>u.id===openUser)

 return <>
  <div className="page-head">
   <div><span className="eyebrow"><i className="dot"/>Access control</span><h1 style={{marginTop:14}}>User permissions</h1><p>Assign school roles. Changes are validated in PostgreSQL, not only in the interface.</p></div>
   <span className="status good"><ShieldCheck size={13}/>{role==='principal'?'Principal control':'VP control'}</span>
  </div>

  {message&&<div className="command" style={{marginBottom:18}}><div><small>STATUS</small><b>{message}</b></div><i className="pulse"/></div>}

  <section className="panel cms-role-panel">
   <div className="panel-head">
    <div><small>ACCOUNTS</small><h2>Role assignments</h2><p>{role==='principal'?'You can assign every school role.':'You can manage Section Head, Reviewer and Teacher roles. Principal and VP accounts are protected.'}</p></div>
    <span className="cms-account-count">{users.length} account{users.length===1?'':'s'}</span>
   </div>

   <div className="table-wrap cms-role-table-wrap">
    <table className="table cms-role-table">
     <thead><tr><th>User</th><th>Current role</th><th>Permission</th></tr></thead>
     <tbody>{users.map(u=>{
      const protectedFromVp=role==='vice_principal'&&['principal','vice_principal'].includes(u.role)
      const isSelf=profile?.id===u.id
      const locked=protectedFromVp||isSelf
      const reason=isSelf?'You cannot change your own role.':'Protected leadership account.'
      return <tr key={u.id}>
       <td><div className="cms-user-cell"><span className="avatar mini">{(u.full_name||'U').slice(0,1).toUpperCase()}</span><div><b>{u.full_name||'Unnamed user'}</b><small>{u.teacher_id?`Teacher #${u.teacher_id}`:'Staff account'}</small></div></div></td>
       <td><span className={`role-chip role-${u.role}`}>{ROLE_LABEL[u.role]||u.role}</span></td>
       <td>{locked
        ? <div className="cms-role-locked"><ShieldCheck size={14}/><span>{reason}</span></div>
        : <button
           type="button"
           className="cms-role-trigger"
           aria-haspopup="listbox"
           aria-expanded={openUser===u.id}
           disabled={busy===u.id}
           onClick={e=>openPicker(u,e.currentTarget)}
           onKeyDown={e=>{if(['ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();openPicker(u,e.currentTarget)}}}
          ><span>{busy===u.id?'Updating…':ROLE_LABEL[u.role]||u.role}</span><ChevronDown size={15}/></button>}
       </td>
      </tr>
     })}</tbody>
    </table>
   </div>
  </section>

  {openProfile&&menuPos&&<div
   className="cms-role-floating-menu"
   role="listbox"
   aria-label={`Role for ${openProfile.full_name}`}
   style={{top:menuPos.top,left:menuPos.left,width:menuPos.width}}
  >
   {options.map(o=><button
    type="button"
    role="option"
    aria-selected={openProfile.role===o}
    className={openProfile.role===o?'active':''}
    key={o}
    onKeyDown={menuKey}
    onClick={()=>changeRole(openProfile,o)}
   ><span><UserCog size={14}/>{ROLE_LABEL[o]||o}</span>{openProfile.role===o&&<Check size={14}/>}</button>)}
  </div>}
 </>
}
