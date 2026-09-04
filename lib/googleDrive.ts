import { createSign,randomUUID } from 'node:crypto'

const TOKEN_URL='https://oauth2.googleapis.com/token'
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive'

function required(name:string){
  const value=process.env[name]
  if(!value)throw new Error(`Missing ${name}`)
  return value
}

function base64url(value:Buffer|string){
  const b=Buffer.isBuffer(value)?value:Buffer.from(value)
  return b.toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
}

async function accessToken(){
  const clientId=process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret=process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const refreshToken=process.env.GOOGLE_DRIVE_REFRESH_TOKEN

  // Recommended for a normal My Drive folder: OAuth 2.0 on behalf of a human
  // Google account so that account owns the evidence files.
  if(clientId&&clientSecret&&refreshToken){
    const response=await fetch(TOKEN_URL,{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({
        client_id:clientId,
        client_secret:clientSecret,
        refresh_token:refreshToken,
        grant_type:'refresh_token',
      }),
      cache:'no-store',
    })
    const body=await response.json().catch(()=>({}))
    if(!response.ok||!body.access_token){
      throw new Error(body.error_description||body.error||'Google Drive OAuth refresh failed')
    }
    return String(body.access_token)
  }

  // Service-account mode is suitable for Google Workspace Shared Drives.
  const email=required('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey=required('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g,'\n')
  const now=Math.floor(Date.now()/1000)
  const header=base64url(JSON.stringify({alg:'RS256',typ:'JWT'}))
  const payload=base64url(JSON.stringify({
    iss:email,
    scope:DRIVE_SCOPE,
    aud:TOKEN_URL,
    iat:now,
    exp:now+3600,
  }))
  const unsigned=`${header}.${payload}`
  const signer=createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const signature=base64url(signer.sign(privateKey))
  const assertion=`${unsigned}.${signature}`

  const response=await fetch(TOKEN_URL,{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({
      grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache:'no-store',
  })
  const body=await response.json().catch(()=>({}))
  if(!response.ok||!body.access_token){
    throw new Error(body.error_description||body.error||'Google Drive service-account authentication failed')
  }
  return String(body.access_token)
}

export function googleDriveConfigured(){
  const oauth=Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  )
  const serviceAccount=Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )
  return Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID&&(oauth||serviceAccount))
}

function driveQueryLiteral(value:string){
  return value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")
}

async function findTeacherFolder(token:string,teacherId:number,folderName:string){
  const rootFolderId=required('GOOGLE_DRIVE_FOLDER_ID')
  const q=[
    `'${driveQueryLiteral(rootFolderId)}' in parents`,
    `mimeType='application/vnd.google-apps.folder'`,
    `appProperties has { key='teachtrackTeacherId' and value='${driveQueryLiteral(String(teacherId))}' }`,
    'trashed=false',
  ].join(' and ')
  const params=new URLSearchParams({
    q,
    fields:'files(id,name,createdTime)',
    pageSize:'10',
    spaces:'drive',
    supportsAllDrives:'true',
    includeItemsFromAllDrives:'true',
  })
  const response=await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`,{
    headers:{authorization:`Bearer ${token}`},
    cache:'no-store',
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok){
    throw new Error(data?.error?.message||'Unable to check the teacher Google Drive folder')
  }
  const files=Array.isArray(data.files)?data.files:[]
  if(files[0])return files[0] as {id:string;name:string}

  // Backward compatibility for folders created before appProperties were added.
  const legacyQ=[
    `'${driveQueryLiteral(rootFolderId)}' in parents`,
    `name='${driveQueryLiteral(folderName)}'`,
    `mimeType='application/vnd.google-apps.folder'`,
    'trashed=false',
  ].join(' and ')
  const legacyParams=new URLSearchParams({
    q:legacyQ,
    fields:'files(id,name,createdTime)',
    pageSize:'10',
    spaces:'drive',
    supportsAllDrives:'true',
    includeItemsFromAllDrives:'true',
  })
  const legacyResponse=await fetch(`https://www.googleapis.com/drive/v3/files?${legacyParams.toString()}`,{
    headers:{authorization:`Bearer ${token}`},
    cache:'no-store',
  })
  const legacyData=await legacyResponse.json().catch(()=>({}))
  if(!legacyResponse.ok){
    throw new Error(legacyData?.error?.message||'Unable to check the teacher Google Drive folder')
  }
  const legacyFiles=Array.isArray(legacyData.files)?legacyData.files:[]
  return legacyFiles[0] as {id:string;name:string}|undefined
}

async function createTeacherFolder(token:string,teacherId:number,folderName:string){
  const rootFolderId=required('GOOGLE_DRIVE_FOLDER_ID')
  const response=await fetch(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name',
    {
      method:'POST',
      headers:{
        authorization:`Bearer ${token}`,
        'content-type':'application/json',
      },
      body:JSON.stringify({
        name:folderName,
        mimeType:'application/vnd.google-apps.folder',
        parents:[rootFolderId],
        description:`TeachTrack evidence folder for teacher ID ${teacherId}`,
        appProperties:{
          teachtrackKind:'teacher-evidence',
          teachtrackTeacherId:String(teacherId),
        },
      }),
      cache:'no-store',
    }
  )
  const data=await response.json().catch(()=>({}))
  if(!response.ok||!data.id){
    throw new Error(data?.error?.message||'Unable to create the teacher Google Drive folder')
  }
  return data as {id:string;name:string}
}

export async function getOrCreateTeacherEvidenceFolder(teacherId:number,teacherCode?:string|null){
  if(!Number.isSafeInteger(teacherId)||teacherId<=0){
    throw new Error('A valid teacher ID is required for Google Drive evidence storage')
  }
  const token=await accessToken()
  const folderName=(teacherCode||String(teacherId)).trim()||String(teacherId)
  const existing=await findTeacherFolder(token,teacherId,folderName)
  if(existing)return existing
  return createTeacherFolder(token,teacherId,folderName)
}

export async function uploadEvidenceToDrive(input:{
  name:string
  mimeType:string
  bytes:ArrayBuffer
  teacherId:number
  teacherCode?:string|null
}){
  const token=await accessToken()
  const folderName=(input.teacherCode||String(input.teacherId)).trim()||String(input.teacherId)
  const teacherFolder=await findTeacherFolder(token,input.teacherId,folderName)??await createTeacherFolder(token,input.teacherId,folderName)
  const folderId=teacherFolder.id
  const boundary=`teachtrack_${randomUUID()}`
  const metadata={
    name:input.name,
    parents:[folderId],
    description:'TeachTrack evidence attachment',
  }
  const head=Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`+
    `--${boundary}\r\nContent-Type: ${input.mimeType||'application/octet-stream'}\r\n\r\n`
  )
  const tail=Buffer.from(`\r\n--${boundary}--`)
  const body=Buffer.concat([head,Buffer.from(input.bytes),tail])

  const response=await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,createdTime',
    {
      method:'POST',
      headers:{
        authorization:`Bearer ${token}`,
        'content-type':`multipart/related; boundary=${boundary}`,
      },
      body:new Uint8Array(body),
      cache:'no-store',
    }
  )
  const data=await response.json().catch(()=>({}))
  if(!response.ok||!data.id){
    throw new Error(data?.error?.message||'Google Drive upload failed')
  }
  return data as {id:string;name:string;mimeType?:string;size?:string;createdTime?:string}
}

export async function deleteDriveFile(fileId:string){
  const token=await accessToken()
  const response=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,{
    method:'DELETE',
    headers:{authorization:`Bearer ${token}`},
    cache:'no-store',
  })
  if(!response.ok&&response.status!==404){
    const data=await response.json().catch(()=>({}))
    throw new Error(data?.error?.message||'Unable to remove Google Drive file')
  }
}

export async function downloadDriveFile(fileId:string){
  const token=await accessToken()
  return fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    {headers:{authorization:`Bearer ${token}`},cache:'no-store'}
  )
}
