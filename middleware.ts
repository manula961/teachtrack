import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

const teacherRoutes = ['/achievement-wall', '/achievements', '/action-center', '/alerts', '/analytics', '/approvals', '/archive', '/attendance', '/calendar', '/calendar-view', '/certificate-calendar', '/classes', '/compare', '/conflicts', '/dashboard', '/data-completeness', '/data-quality', '/demo-reset', '/department-health', '/department-insights', '/departments', '/development', '/documents', '/drafts', '/duties', '/evidence', '/exams', '/exports', '/favorites', '/feedback', '/goal-checkins', '/goals', '/help', '/intelligence', '/leaderboard', '/leave', '/lessons', '/meeting-actions', '/meetings', '/mentoring', '/milestones', '/my-hub', '/notification-preferences', '/notifications', '/observation-followup', '/observations', '/organization', '/pathway', '/period-compare', '/plan-progress', '/plans', '/portfolio', '/presentation', '/qr-attendance', '/recent', '/recognition-cards', '/report-builder', '/reports', '/rubrics', '/school-goals', '/school-promotion', '/search', '/security', '/service-history', '/settings', '/skills-matrix', '/subjects', '/substitution-assistant', '/teacher-360', '/teachers', '/terms', '/timetable', '/timetable-generator', '/today', '/training', '/workload', '/workload-fairness']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isTeacherArea = teacherRoutes.some(route => path === route || path.startsWith(route + '/'))
  const isCmsArea = path === '/cms' || path.startsWith('/cms/')
  const isCmsLogin = path === '/cms/login'

  if (!user && isTeacherArea) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (!user && isCmsArea && !isCmsLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/login'
    return NextResponse.redirect(url)
  }

  if (user && isCmsLogin) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = ['principal','vice_principal','section_head','reviewer'].includes(String(profile?.role)) ? '/cms' : '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && path === '/auth') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = ['principal','vice_principal','section_head','reviewer'].includes(String(profile?.role)) ? '/cms' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
