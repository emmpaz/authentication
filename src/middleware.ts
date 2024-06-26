import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, TOKEN_COOKIE_NAME } from "./actions/jwt";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";


/**
 * Next has two server runtimes
 *  - node.js runtime
 *      - 
 *  - edge runtime (more limited)
 *      - used for middleware
 * 
 */


export async function middleware(request: NextRequest) {
  const token = cookies().get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  };

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET_KEY as string)
    );
  } catch (error) {
    const refresh = await fetch('https://localhost:3000/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh: cookies().get(REFRESH_COOKIE_NAME)?.value,
      })
    });
    let response : NextResponse;
    if (refresh.ok) {
      response = NextResponse.next();

      const { access_token, refresh_token } = await refresh.json();


      response.cookies.set({
        name: TOKEN_COOKIE_NAME,
        value: access_token,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      })

      response.cookies.set({
        name: REFRESH_COOKIE_NAME,
        value: refresh_token,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      })

      return response;
    }

    response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(TOKEN_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);
    
    return response;
  }
  const response = NextResponse.next();
  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    '/'
  ],
};