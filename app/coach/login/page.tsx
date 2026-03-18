"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoachLoginPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/coach");
        router.refresh();
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-10 backdrop-blur-xl shadow-2xl relative">
        <div className="text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase flex flex-col gap-1">
            <span className="text-cyan-500 text-sm not-italic tracking-[0.3em] font-bold mb-2">Espace Coach</span>
            Connexion
          </h1>
          <p className="mt-4 text-sm text-zinc-500 font-medium">
            Entrez vos identifiants pour gérer votre équipe.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                placeholder="Ex: Jean"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                placeholder="Ex: Dupont"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Se Connecter"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <a href="/" className="text-[10px] font-bold text-zinc-600 hover:text-cyan-400 uppercase tracking-widest transition-colors">
            ← Retour au site public
          </a>
        </div>
      </div>
    </main>
  );
}
