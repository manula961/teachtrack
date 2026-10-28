// Read-only HTTP smoke checks; no credentials are required or logged.
const origin=process.env.BASE_URL
if(!origin){console.error('Set BASE_URL to your deployed site origin');process.exit(2)}
const base=new URL(origin)
const tests=[
  ['health', '/api/health', response=>response.ok],
  ['login', '/auth', response=>response.ok],
  ['dashboard authentication', '/dashboard', response=>response.status===200 || (response.status>=300&&response.status<400)]
]
let failed=0
for(const [name,path,validate] of tests){
 try{
  const r=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(10000)})
  const pass=validate(r)
  console.log(`${pass?'PASS':'FAIL'} ${name}: HTTP ${r.status}`)
  if(!pass)failed++
 }catch(err){
  console.error(`FAIL ${name}: ${err.message}`);failed++
 }
}
process.exitCode=failed?1:0
