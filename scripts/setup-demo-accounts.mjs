import {createClient} from '@supabase/supabase-js'
import {existsSync,readFileSync} from 'node:fs'
import {resolve} from 'node:path'

function loadEnvFile(file){
  const path=resolve(process.cwd(),file)
  if(!existsSync(path))return false
  for(const rawLine of readFileSync(path,'utf8').split(/\r?\n/)){
    const line=rawLine.trim()
    if(!line||line.startsWith('#'))continue
    const i=line.indexOf('=')
    if(i<1)continue
    const key=line.slice(0,i).trim()
    let value=line.slice(i+1).trim()
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'"))){
      value=value.slice(1,-1)
    }
    if(process.env[key]===undefined)process.env[key]=value
  }
  return true
}

// Next.js commonly uses .env.local, while this project may already use .env.
// Load both safely without requiring an extra package.
const loadedLocal=loadEnvFile('.env.local')
const loadedBase=loadEnvFile('.env')

const url=process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY
const confirmation=process.env.ALLOW_DEMO_ACCOUNT_SETUP

if(!url){
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local or .env.')
  process.exit(1)
}
if(!serviceKey){
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Add the server-only service role key to .env.local or .env, then run npm run demo:setup again.')
  console.error('Do NOT prefix it with NEXT_PUBLIC_ and do NOT commit it to GitHub.')
  process.exit(1)
}
if(confirmation!=='YES_I_UNDERSTAND'){
  console.error('Safety stop: set ALLOW_DEMO_ACCOUNT_SETUP=YES_I_UNDERSTAND only when this Supabase project is safe for public demo accounts.')
  process.exit(1)
}

const supabase=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
const password='TeachTrack#2026'
const accounts=[
  {role:'principal',label:'Demo Principal',email:'demo.principal@school.lk'},
  {role:'vice_principal',label:'Demo Vice Principal',email:'demo.vp@school.lk'},
  {role:'section_head',label:'Demo Section Head',email:'demo.section@school.lk'},
  {role:'reviewer',label:'Demo Reviewer',email:'demo.reviewer@school.lk'},
  {role:'teacher',label:'Demo Teacher',email:'demo.teacher@school.lk'},
]

async function findAuthUser(email){
  for(let page=1;page<=20;page++){
    const {data,error}=await supabase.auth.admin.listUsers({page,perPage:100})
    if(error)throw error
    const match=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase())
    if(match)return match
    if(data.users.length<100)break
  }
  return null
}

async function ensureTeacherRecord(){
  const {data:existing,error:readError}=await supabase.from('teachers').select('id,user_id').eq('email','demo.teacher@school.lk').maybeSingle()
  if(readError)throw readError
  if(existing)return existing

  const {data,error}=await supabase.from('teachers').insert({
    name:'Demo Teacher',
    initials:'D.T.',
    subject:'Mathematics',
    department:'Mathematics',
    section:'Senior Secondary',
    email:'demo.teacher@school.lk',
    experience:7,
    qualification:'B.Ed. · Demo Record',
    skills:['Classroom Management','Assessment','ICT'],
    status:'Active',
    milestones:['Competition demo teacher profile']
  }).select('id,user_id').single()
  if(error)throw error
  return data
}

console.log(`Environment files: ${loadedLocal?'.env.local ':''}${loadedBase?'.env':''}`.trim()||'process environment')
console.log(`Target Supabase project: ${url}`)
console.log('Creating/updating intentionally public competition demo users...\n')

const demoTeacher=await ensureTeacherRecord()

for(const account of accounts){
  let user=await findAuthUser(account.email)

  if(!user){
    const {data,error}=await supabase.auth.admin.createUser({
      email:account.email,
      password,
      email_confirm:true,
      user_metadata:{full_name:account.label,demo_account:true}
    })
    if(error)throw error
    user=data.user
    console.log(`Created ${account.role}: ${account.email}`)
  }else{
    const {error}=await supabase.auth.admin.updateUserById(user.id,{
      password,
      user_metadata:{...(user.user_metadata||{}),full_name:account.label,demo_account:true}
    })
    if(error)throw error
    console.log(`Updated ${account.role}: ${account.email}`)
  }

  const profilePatch={
    id:user.id,
    full_name:account.label,
    role:account.role,
    teacher_id:account.role==='teacher'?demoTeacher.id:null
  }
  const {error:profileError}=await supabase.from('profiles').upsert(profilePatch,{onConflict:'id'})
  if(profileError)throw profileError

  if(account.role==='teacher'){
    const {error:teacherError}=await supabase.from('teachers').update({user_id:user.id}).eq('id',demoTeacher.id)
    if(teacherError)throw teacherError
  }
}

console.log('\nDemo accounts are ready.')
console.log('Shared password: TeachTrack#2026')
console.log('Teacher portal: /auth')
console.log('Leadership portal: /cms/login')
console.log('\nIMPORTANT: remove/disable these public accounts before using this Supabase project for real school data.')
