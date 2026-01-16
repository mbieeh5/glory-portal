import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") ?? "";
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
          return;
        },
      },
    },
  );

  const claimsRes = await supabase.auth.getClaims();
  const out: any = { claims: claimsRes.data ?? null };

  // 1) Try calling auth.uid() via a lightweight safe query (use pg_catalog table to avoid missing helper)
  try {
    const { data, error } = await supabase
      .from('pg_catalog.pg_user') // a harmless table to call select via the client
      .select('usename')
      .limit(1);
    out.pg_user_probe = error ? { error: error.message } : data;
  } catch (e: any) {
    out.pg_user_probe = { error: e.message };
  }

  // 2) Query the glory.services_transactions table directly (correct schema qualification)
  try {
    const { data, error } = await supabase
      .from('glory.services_transactions')
      .select('*')
      .limit(5);
    out.sample_rows = error ? { error: error.message } : data;
  } catch (e: any) {
    out.sample_rows = { error: e.message };
  }

  // 3) Also attempt to call a simple RPC that returns auth.uid() if present in your DB as an example:
  // Note: many projects do not have this RPC; it's optional.
  try {
    const { data, error } = await supabase.rpc('get_auth_uid'); // optional helper name, may error
    out.rpc_get_auth_uid = error ? { error: error.message } : data;
  } catch (e: any) {
    out.rpc_get_auth_uid = { error: e.message };
  }

  return NextResponse.json(out);
}
