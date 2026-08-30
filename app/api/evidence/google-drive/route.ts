import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteDriveFile,googleDriveConfigured,uploadEvidenceToDrive } from '@/lib/googleDrive'

export const runtime='nodejs'

const REVIEW_ROLES=new Set(['principal','vice_principal','section_head','reviewer'])
const MAX_FILE_BYTES=20*1024*1024
const ALLOWED_TYPES=new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

function cleanName(name:string){
  return name.replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120)||'evidence'
}

export async function POST(request:Request){
  try{
    if(!googleDriveConfigured()){
      return NextResponse.json({error:'Google Drive evidence storage is not configured.'},{status:503})
    }

    const supabase=await createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return NextResponse.json({error:'Authentication required.'},{status:401})

    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('role,teacher_id')
      .eq('id',user.id)
      .single()

    if(profileError||!profile){
      return NextResponse.json({error:'User profile not found.'},{status:403})
    }

    const form=await request.formData()
    const file=form.get('file')
    if(!(file instanceof File)||!file.size){
      return NextResponse.json({error:'Choose an evidence file.'},{status:400})
    }
    if(file.size>MAX_FILE_BYTES){
      return NextResponse.json({error:'Evidence files are limited to 20 MB.'},{status:413})
    }
    if(file.type&&!ALLOWED_TYPES.has(file.type)){
      return NextResponse.json({error:'This evidence file type is not allowed.'},{status:415})
    }

    const requestedTeacherId=Number(form.get('teacher_id'))
    const ownTeacherId=Number(profile.teacher_id||0)
    const canReview=REVIEW_ROLES.has(String(profile.role))
    const teacherId=canReview?requestedTeacherId:ownTeacherId

    if(!teacherId||(!canReview&&teacherId!==ownTeacherId)){
      return NextResponse.json({error:'You are not allowed to upload evidence for this teacher.'},{status:403})
    }

    const {data:teacherRecord,error:teacherError}=await supabase
      .from('teachers')
      .select('teacher_code')
      .eq('id',teacherId)
      .single()
    if(teacherError||!teacherRecord){
      return NextResponse.json({error:'Teacher record not found.'},{status:404})
    }
    const teacherCode=String(teacherRecord.teacher_code||teacherId).trim()

    const entityType=String(form.get('entity_type')||'Other').trim().slice(0,80)
    const rawEntityId=String(form.get('entity_id')||'').trim()
    const entityId=rawEntityId?Number(rawEntityId):null
    if(rawEntityId&&(!Number.isSafeInteger(entityId)||Number(entityId)<=0)){
      return NextResponse.json({error:'Record ID must be a positive integer.'},{status:400})
    }

    const title=String(form.get('title')||'').trim().slice(0,180)
    const notes=String(form.get('notes')||'').trim().slice(0,4000)
    if(!title)return NextResponse.json({error:'Evidence title is required.'},{status:400})

    const driveName=`${Date.now()}-${cleanName(file.name)}`
    const drive=await uploadEvidenceToDrive({
      name:driveName,
      mimeType:file.type||'application/octet-stream',
      bytes:await file.arrayBuffer(),
      teacherId,
      teacherCode,
    })

    const {data:row,error:insertError}=await supabase
      .from('evidence_attachments')
      .insert({
        teacher_id:teacherId,
        entity_type:entityType,
        entity_id:entityId,
        title,
        storage_path:drive.id,
        storage_provider:'google_drive',
        drive_file_id:drive.id,
        drive_name:drive.name,
        file_type:file.type||file.name.split('.').pop()||'',
        notes,
        uploaded_by:user.id,
      })
      .select('id,title,storage_provider,drive_name')
      .single()

    if(insertError){
      await deleteDriveFile(drive.id).catch(()=>undefined)
      return NextResponse.json({error:insertError.message},{status:400})
    }

    return NextResponse.json({ok:true,evidence:row})
  }catch(error){
    const message=error instanceof Error?error.message:'Evidence upload failed.'
    return NextResponse.json({error:message},{status:500})
  }
}
