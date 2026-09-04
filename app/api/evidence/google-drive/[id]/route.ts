import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteDriveFile,downloadDriveFile,googleDriveConfigured } from '@/lib/googleDrive'

export const runtime='nodejs'

function dispositionName(value:string){
  return value.replace(/[\r\n"]/g,'_').slice(0,160)||'evidence'
}

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    if(!googleDriveConfigured()){
      return NextResponse.json({error:'Google Drive evidence storage is not configured.'},{status:503})
    }

    const supabase=await createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return NextResponse.json({error:'Authentication required.'},{status:401})

    const {id}=await params
    const evidenceId=Number(id)
    if(!Number.isSafeInteger(evidenceId)||evidenceId<=0){
      return NextResponse.json({error:'Invalid evidence ID.'},{status:400})
    }

    // RLS on evidence_attachments is the authorization boundary.
    const {data:evidence,error}=await supabase
      .from('evidence_attachments')
      .select('id,title,storage_provider,drive_file_id,drive_name,file_type')
      .eq('id',evidenceId)
      .single()

    if(error||!evidence){
      return NextResponse.json({error:'Evidence not found or access denied.'},{status:404})
    }
    if(evidence.storage_provider!=='google_drive'||!evidence.drive_file_id){
      return NextResponse.json({error:'This evidence item is not stored in Google Drive.'},{status:409})
    }

    const upstream=await downloadDriveFile(String(evidence.drive_file_id))
    if(!upstream.ok||!upstream.body){
      return NextResponse.json({error:'Unable to read the Google Drive evidence file.'},{status:502})
    }

    const download=request.nextUrl.searchParams.get('download')==='1'
    const name=dispositionName(String(evidence.drive_name||evidence.title||'evidence'))
    const headers=new Headers()
    headers.set('content-type',String(evidence.file_type||upstream.headers.get('content-type')||'application/octet-stream'))
    headers.set('content-disposition',`${download?'attachment':'inline'}; filename="${name}"`)
    headers.set('cache-control','private, no-store')
    const length=upstream.headers.get('content-length')
    if(length)headers.set('content-length',length)

    return new Response(upstream.body,{status:200,headers})
  }catch(error){
    const message=error instanceof Error?error.message:'Unable to open evidence.'
    return NextResponse.json({error:message},{status:500})
  }
}


export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    if(!googleDriveConfigured()){
      return NextResponse.json({error:'Google Drive evidence storage is not configured.'},{status:503})
    }

    const supabase=await createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return NextResponse.json({error:'Authentication required.'},{status:401})

    const {id}=await params
    const evidenceId=Number(id)
    if(!Number.isSafeInteger(evidenceId)||evidenceId<=0){
      return NextResponse.json({error:'Invalid evidence ID.'},{status:400})
    }

    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('role,teacher_id')
      .eq('id',user.id)
      .single()
    if(profileError||!profile){
      return NextResponse.json({error:'User profile not found.'},{status:403})
    }

    const {data:evidence,error}=await supabase
      .from('evidence_attachments')
      .select('id,teacher_id,storage_provider,drive_file_id')
      .eq('id',evidenceId)
      .single()

    if(error||!evidence){
      return NextResponse.json({error:'Evidence not found or access denied.'},{status:404})
    }

    const reviewRoles=new Set(['principal','vice_principal','section_head','reviewer'])
    const canReview=reviewRoles.has(String(profile.role))
    const ownsEvidence=Number(profile.teacher_id||0)>0&&Number(profile.teacher_id)===Number(evidence.teacher_id)
    if(!canReview&&!ownsEvidence){
      return NextResponse.json({error:'You are not allowed to delete this evidence.'},{status:403})
    }

    if(evidence.storage_provider!=='google_drive'||!evidence.drive_file_id){
      return NextResponse.json({error:'Only Google Drive evidence can be deleted from this endpoint.'},{status:409})
    }

    // Prove database authorization before the external Drive side effect.
    const {error:deleteError}=await supabase.from('evidence_attachments').delete().eq('id',evidenceId)
    if(deleteError){
      return NextResponse.json({error:deleteError.message},{status:403})
    }

    try{
      await deleteDriveFile(String(evidence.drive_file_id))
    }catch(driveError){
      const message=driveError instanceof Error?driveError.message:'Unable to remove Google Drive file'
      return NextResponse.json({ok:true,warning:`Evidence record deleted, but Drive cleanup failed: ${message}`},{status:200})
    }

    return NextResponse.json({ok:true})
  }catch(error){
    const message=error instanceof Error?error.message:'Unable to delete evidence.'
    return NextResponse.json({error:message},{status:500})
  }
}
