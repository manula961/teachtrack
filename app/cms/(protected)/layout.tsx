import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CMSShell } from '@/components/CMSShell'

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cms/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['principal','vice_principal','section_head','reviewer'].includes(String(profile?.role))) {
    await supabase.auth.signOut()
    redirect('/auth')
  }

  return <CMSShell>{children}</CMSShell>
}
