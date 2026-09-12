import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Keep the preview renderable when Supabase env vars are not injected yet.
  // Auth-protected routes still enforce their own server-side checks.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Unauthenticated guard ─────────────────────────────────────────────────
  // Any protected route without a session → login
  if ((pathname.startsWith('/admin') || pathname.startsWith('/student')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Already-logged-in redirect ────────────────────────────────────────────
  // User visits /login while already authenticated → send to correct dashboard.
  // We read the role here using the service role key so the middleware can
  // correctly route admins vs students without requiring a layout round-trip.
  if (pathname === '/login' && user) {
    // Use service role for role lookup (server-side only — never reaches the browser)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let role: string | null = null

    if (serviceKey) {
      try {
        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          { cookies: { getAll: () => [], setAll: () => {} } }
        )
        const { data: profile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        role = (profile?.role as string) ?? null
      } catch {
        // Fallback: no role lookup — default to student dashboard for safety
      }
    }

    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : '/student'
    return NextResponse.redirect(url)
  }

  // ── Role-based access control ─────────────────────────────────────────────
  // Student visiting /admin → redirect to /student.
  // We rely on the layout (Server Component) for the definitive role check,
  // but add a fast path here using the cookie-based anon client.
  // The anon client can read profiles if RLS allows it; if not, the layout
  // provides the hard enforcement.
  if (pathname.startsWith('/admin') && user) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      try {
        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          { cookies: { getAll: () => [], setAll: () => {} } }
        )
        const { data: profile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if ((profile?.role as string) !== 'admin') {
          // Authenticated but not an admin → send to student dashboard
          const url = request.nextUrl.clone()
          url.pathname = '/student'
          return NextResponse.redirect(url)
        }
      } catch {
        // On error, fall through to layout-level guard
      }
    }
  }

  // ── Student visiting /admin/* API routes ─────────────────────────────────
  // /api/admin/* routes are protected at the handler level via requireAdmin().
  // No additional middleware redirect needed for API routes (they return JSON errors).

  return supabaseResponse
}
