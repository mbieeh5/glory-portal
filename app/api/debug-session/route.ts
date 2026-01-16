import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  // Create a NextResponse so we can read cookies the same way your middleware does
  const url = new URL(request.url);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          // For Edge runtime Request, use request.headers.get('cookie')
          const cookieHeader = request.headers.get("cookie") ?? "";
          // Next's cookie parsing is not available here; do a simple split
          // Return array of { name, value } for supabase client (it only needs name/value)
          return cookieHeader
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const [name, ...rest] = c.split("=");
              return { name, value: rest.join("=") };
            });
        },
        setAll() {
          // No-op for debug route
          return;
        },
      },
    },
  );

  // Get claims client-side (SSR helper)
  const claimsRes = await supabase.auth.getClaims();

  // Run SQL queries to inspect what Postgres auth.* functions return.
  // We'll use rpc calls to select auth.uid() and auth.jwt() via SQL.
  // Also attempt to call glory.get_auth_uid() if present.
  // And run a small select from your table.
  const queries = {
    auth_uid: `select auth.uid() as uid;`,
    auth_jwt: `select auth.jwt() as jwt;`,
    helper_get_auth_uid: `select case when (select proname from pg_proc where proname = 'get_auth_uid' and pronamespace = (select oid from pg_namespace where nspname = 'glory')) is not null then (select glory.get_auth_uid()::text) else null end as helper;`,
    sample_rows: `select * from glory.services_transactions limit 5;`,
  };

  // Execute queries one by one so we can capture errors separately
  const results: Record<string, any> = { claims: claimsRes.data ?? null };

  try {
    const { data: uidData, error: uidErr } = await supabase.rpc("sql", {
      q: queries.auth_uid,
    } as any);
    // If rpc('sql') is not available, fall back to from().select() on a safe table
    results.auth_uid = uidErr ? { error: uidErr.message } : uidData;
  } catch (e: any) {
    results.auth_uid = { error: e.message };
  }

  try {
    const { data: jwtData, error: jwtErr } = await supabase.rpc("sql", {
      q: queries.auth_jwt,
    } as any);
    results.auth_jwt = jwtErr ? { error: jwtErr.message } : jwtData;
  } catch (e: any) {
    results.auth_jwt = { error: e.message };
  }

  try {
    const { data: helperData, error: helperErr } = await supabase.rpc("sql", {
      q: queries.helper_get_auth_uid,
    } as any);
    results.helper_get_auth_uid = helperErr ? { error: helperErr.message } : helperData;
  } catch (e: any) {
    results.helper_get_auth_uid = { error: e.message };
  }

  try {
    const { data: rows, error: rowsErr } = await supabase
      .from("glory.services_transactions")
      .select("*")
      .limit(5);
    results.sample_rows = rowsErr ? { error: rowsErr.message } : rows;
  } catch (e: any) {
    results.sample_rows = { error: e.message };
  }

  return NextResponse.json(results);
}
