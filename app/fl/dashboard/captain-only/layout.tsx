import { redirect } from "next/navigation";
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

export default async function CaptainOnly({ children }: { children: ReactNode }) {

  const userRole = await UserDetails().then((claims) => claims?.app_metadata?.role || 'null');
  const menus = getMenus('captain', userRole);

  if(userRole !== 'admin'){
    redirect("/fl/dashboard")
  }

  return (
    <DashboardShell 
      title="Cockpit" 
      subtitle="panel instrument"
      menuItems={menus} 
      themeColor="orange"
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
