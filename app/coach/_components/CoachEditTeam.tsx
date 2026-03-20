"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Team = {
  id: string;
  name: string;
  colors?: string | null;
  coachFirstName?: string;
  coachLastName?: string;
  logoUrl?: string | null;
};

export function CoachEditTeam({ team }: { team: Team }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      colors: formData.get("colors"),
      coachFirstName: formData.get("coachFirstName"),
      coachLastName: formData.get("coachLastName"),
    };

    try {
      const res = await fetch(`/api/coach/equipes/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Équipe mise à jour !");
        setTimeout(() => {
          setEditing(false);
          router.refresh();
        }, 1000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button 
        onClick={() => setEditing(true)}
        className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-2 text-xs font-black uppercase tracking-widest text-cyan-500 hover:bg-zinc-900 transition-all shadow-lg active:scale-95"
      >
        Modifier les informations du club
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/50 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Modifier le Club</h3>
          <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {message && (
          <div className={`mb-4 rounded-xl border p-4 text-center ${message.includes("mise à jour") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}>
            <p className="text-xs font-black uppercase tracking-widest">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Nom du Club</label>
            <input name="name" required defaultValue={team.name} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Prénom Coach</label>
              <input name="coachFirstName" required defaultValue={team.coachFirstName} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Nom Coach</label>
              <input name="coachLastName" required defaultValue={team.coachLastName} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Couleurs</label>
            <input name="colors" defaultValue={team.colors || ""} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Bleu / Blanc" />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Annuler</button>
            <button
              disabled={loading}
              className="flex-1 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50"
            >
              {loading ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
