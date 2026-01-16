import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies
            ? Object.entries(req.cookies).map(([name, value]) => ({ name, value }))
            : [];
        },
        setAll() { return; },
      },
    },
  );

  const claimsRes = await supabase.auth.getClaims();
  const out: any = { claims: claimsRes.data ?? null };

  // 1) Get auth.uid() and auth.jwt() via Postgres using SQL through the query builder
  try {
    const { data: uidData, error: uidErr } = await supabase.rpc('auth_uid_helper');
    // If you don't have rpc helper installed, we'll instead run a raw SQL via from().select on pg_catalog
    out.auth_uid = uidErr ? { error: uidErr.message } : uidData;
  } catch (e: any) {
    out.auth_uid = { error: e.message };
  }

  // 2) Select directly from your schema.table
  try {
    const { data, error } = await supabase
      .from('glory.services_transactions')
      .select('*')
      .limit(5);
    out.sample_rows = error ? { error: error.message } : data;
  } catch (e: any) {
    out.sample_rows = { error: e.message };
  }

  res.status(200).json(out);
}
