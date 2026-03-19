import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/app/_components/admin-panel";
import { getDashboardData } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "true") {
    redirect("/admin/login");
  }

  const data = await getDashboardData();

  async function logout() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div suppressHydrationWarning className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-cyan-500/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-300">Administration Inter-Classe</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Gérez les équipes, les joueurs et les matchs du tournoi.
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </header>

        <AdminPanel 
          teams={data.teams} 
          matches={data.allMatches} 
          managers={data.managers as any} 
        />
        
        <div className="flex justify-center">
          <a
            href="/"
            className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors underline underline-offset-4"
          >
            Retour au site public
          </a>
        </div>
      </div>
    </main>
  );
}
