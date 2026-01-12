import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
