"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, ArrowRight } from "lucide-react";

export default function ManagerLogin() {
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Identifiants invalides");
      }

      router.push("/manager/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[32px] shadow-2xl space-y-8 backdrop-blur-sm bg-zinc-950/80">
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-500 mb-4 border border-cyan-500/20">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Portail Gestionnaire</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Connectez-vous pour piloter votre match</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Prénom</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 pl-12 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 focus:bg-zinc-800/50 transition-all placeholder:text-zinc-700"
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Mot de Passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 pl-12 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 focus:bg-zinc-800/50 transition-all placeholder:text-zinc-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase text-center animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-white text-black hover:bg-cyan-400 py-5 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? "Connexion..." : "Accéder à la régie"}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
