export type DemoRole='principal'|'vice_principal'|'section_head'|'reviewer'|'teacher'

export type DemoAccount={
  role:DemoRole
  label:string
  email:string
  password:string
  portal:'cms'|'teacher'
  note:string
}

export const DEMO_PASSWORD='TeachTrack#2026'

export const DEMO_ACCOUNTS:DemoAccount[]=[
  {
    role:'principal',
    label:'Principal',
    email:'demo.principal@school.lk',
    password:DEMO_PASSWORD,
    portal:'cms',
    note:'Full leadership view including User Control.'
  },
  {
    role:'vice_principal',
    label:'Vice Principal',
    email:'demo.vp@school.lk',
    password:DEMO_PASSWORD,
    portal:'cms',
    note:'Leadership access without Principal/VP role editing.'
  },
  {
    role:'section_head',
    label:'Section Head',
    email:'demo.section@school.lk',
    password:DEMO_PASSWORD,
    portal:'cms',
    note:'Section-level review and development tools.'
  },
  {
    role:'reviewer',
    label:'Reviewer',
    email:'demo.reviewer@school.lk',
    password:DEMO_PASSWORD,
    portal:'cms',
    note:'Observation/review workflows without User Control.'
  },
  {
    role:'teacher',
    label:'Teacher',
    email:'demo.teacher@school.lk',
    password:DEMO_PASSWORD,
    portal:'teacher',
    note:'Teacher self-service, goals, portfolio and timetable.'
  }
]

export function demoAccount(role:string|null|undefined){
  return DEMO_ACCOUNTS.find(a=>a.role===role)
}
