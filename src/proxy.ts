import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session fresh and sends anyone who isn't signed in to /login.
 * (An optimistic check; the database's access rules are what actually protect the data.)
 */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const db = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await db.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  if (!signedIn && path !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (signedIn && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Everything except Next's own files and the generic art in /public. Our avatars and card images need a login.
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico|backgrounds/|scenes/|textures/).*)"],
};
