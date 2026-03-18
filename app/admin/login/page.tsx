import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const username = formData.get("username");
    const password = formData.get("password");

    if (username === "admin" && password === "admin789") {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
      redirect("/admin");
    } else {
      redirect("/admin/login?message=Identifiants invalides");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-cyan-500/10">
        <h1 className="text-2xl font-bold text-cyan-300">Connexion Administration</h1>
        <p className="mt-2 text-sm text-zinc-400">Veuillez vous connecter pour gérer le tournoi.</p>
        
        {message && (
          <div className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
            {message}
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300" htmlFor="username">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-800 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
