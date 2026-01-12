import { Suspense } from "react";

export default async function DashboardFlLayout({children}: {children: React.ReactNode}) {
  
  return (
    <Suspense>
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
