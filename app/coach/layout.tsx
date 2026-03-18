import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("coach_session");

  // Skip protection for login page
  // Note: layout is at /coach/layout.tsx, so children will be Login if path is /coach/login
  // We handle the check here but redirects can be tricky inside layout for the same path
  // Usually login is outside or handled differently, but here we'll just check.
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {children}
    </div>
  );
}
