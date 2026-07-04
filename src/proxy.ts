import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin/dashboard')
  
  if (isAdminRoute) {
    const adminToken = request.cookies.get('admin_token')?.value
    
    if (adminToken !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
