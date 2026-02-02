import LoadingScreen from "@/components/LoadingScreen";
import { Suspense } from "react";
 
export default async function DashboardFlLayout({children}: {children: React.ReactNode}) {



  return (
    // Fallback item bisa loading spinner atau skeleton
    <Suspense fallback={<LoadingScreen />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

async function AuthGate({children}: {children: React.ReactNode}) {
  return(
    <>
      {children}
    </>
  )

}
