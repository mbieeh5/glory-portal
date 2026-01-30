import { redirect } from "next/navigation"; // 3. Import redirect
import { ReactNode } from "react";
import DashboardShell from "@/components/DashboardShell";
import { getMenus } from "@/config/getMenuByRole";
import { createClient } from "@/lib/supabase/server";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return data.claims;
}

export default async function ServiceLayout({ children }: { children: ReactNode }) {

  const userRole = await UserDetails().then((claims) => claims?.app_metadata?.role || 'null');
  const userName = await UserDetails().then((claims) => claims?.email || 'null');
  const menus = getMenus('service', userRole);

  return (
    <DashboardShell 
      title="Glory Service" 
      subtitle="Technical Division"
      menuItems={menus}
      themeColor="orange"
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
