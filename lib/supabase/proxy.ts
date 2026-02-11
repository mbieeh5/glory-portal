import { bankMenus, captainMenus, serviceMenus } from "@/config/menu";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const currentPath = request.nextUrl.pathname

  // 1. Filter Path: Only for proceed if the path start With "/fl"
  if(!currentPath.startsWith('/fl')) {
    return supabaseResponse;
  }

  // 2. Auth Check: Must Login for /fl
  if(!user){
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 3. RBAC Logic
  // Gabungin semua menu jadi satu object besar
  const allMenusByRole = {
    frontliner: [...serviceMenus.frontliner, ...bankMenus.frontliner, ...captainMenus.frontliner],
    moderator: [...serviceMenus.moderator, ...bankMenus.moderator, ...captainMenus.moderator],
    admin: [...serviceMenus.admin, ...bankMenus.admin, ...captainMenus.admin],
  };

  const userRole = (user.app_metadata?.role?.toLowerCase() || 'user') as keyof typeof allMenusByRole;

  // Daftar path "Sakti" (Boleh diakses semua role yang sudah login)
  const commonPaths = ['/fl/dashboard', '/fl/dashboard/settings'];

  // Ambil semua href yang dibolehin buat role si user dari Master List
  const allowedRoutes = allMenusByRole[userRole]?.map(item => item.href) || [];

  // Cek: Apakah path sekarang ada di commonPaths ATAU ada di daftar menu rolenya?
  const isAllowed = commonPaths.includes(currentPath) || allowedRoutes.some(path => currentPath.startsWith(path));

  if (!isAllowed) {
    // Kalau nekat akses yang bukan haknya, lempar ke 403 atau balik ke dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/403"; 
    return NextResponse.rewrite(url);
  }
  /**
   * 
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/services") &&
    !request.nextUrl.pathname.startsWith("/profile")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  
  */
  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
