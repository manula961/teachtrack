// Read-only public HTTP tests. This script never authenticates or mutates data.
const origin=process.env.BASE_URL
if(!origin){console.error("Set BASE_URL to the application's public URL");process.exit(2)}
const base=new URL(origin)
if(base.protocol!=='https:'){console.error('BASE_URL must use HTTPS');process.exit(2)}
const tests=[
  {name:'Health API',path:'/api/health',check:async r=>r.ok && (await r.json()).ok===true},
  {name:'Teacher sign-in',path:'/auth',check:async r=>r.ok},
  {name:'Leadership sign-in',path:'/cms/login',check:async r=>r.ok},
  {name:'Demo access',path:'/demo-access',check:async r=>r.ok},
  {name:'Anonymous dashboard protection',path:'/dashboard',
   check:async r=>[301,302,303,307,308].includes(r.status) && new URL(r.headers.get('location')||'/',base).pathname==='/auth'},
  {name:'Anonymous CMS protection',path:'/cms',
   check:async r=>[301,302,303,307,308].includes(r.status) && new URL(r.headers.get('location')||'/',base).pathname==='/cms/login'}
]
let failures=0
for(const t of tests){
  try {
    const response=await fetch(new URL(t.path,base),{
      redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)
    })
    const success=await t.check(response)
    console.log(`${success?'PASS':'FAIL'} ${t.name} — HTTP ${response.status}`)
    if(!success)failures++
  }catch(error){
    console.error(`FAIL ${t.name} — ${error.message}`)
    failures++
  }
}
console.log(`Smoke tests: ${tests.length-failures}/${tests.length} passed`)
process.exitCode=failures?1:0
