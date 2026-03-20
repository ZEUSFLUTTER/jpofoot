"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Hash, UserPlus, CheckCircle2, Plus } from "lucide-react";

const POSITIONS = [
  "Gardien de but (GB)",
  "Défenseur central (DC)",
  "Défenseur latéral droit (DD)",
  "Défenseur latéral gauche (DG)",
  "Milieu défensif (MDC)",
  "Milieu central / Relayeur (MC)",
  "Milieu offensif / Meneur de jeu (MOC)",
  "Ailier droit (AD)",
  "Ailier gauche (AG)",
  "Attaquant de pointe / Buteur (BU)",
  "Sur le banc",
  "Remplaçants",
  "L'encadrement technique",
  "Capitaine (C)",
  "Coach / Entraîneur principal",
];

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
};

export function CoachAddPlayer({ teamId, players = [] }: { teamId: string; players?: Player[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data.url;
    } catch (err: any) {
      setMessage(`Erreur upload: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const file = formData.get("photoFile") as File;
    let photoUrl = "";
    if (file && file.size > 0) {
      photoUrl = (await uploadFile(file)) || "";
      if (!photoUrl && file.size > 0) {
         setLoading(false);
         return; // Upload failed, error message already set
      }
    }

    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      number: Number(formData.get("number")),
      position: formData.get("position"),
      photoUrl,
      teamId,
    };

    // Client-side Duplicate Check
    const isDuplicate = players.some(p => {
      const sameName = p.firstName.toLowerCase() === (payload.firstName as string).toLowerCase() && 
                       p.lastName.toLowerCase() === (payload.lastName as string).toLowerCase();
      const sameNumber = Number(p.number) === Number(payload.number);
      return sameName || sameNumber;
    });

    if (isDuplicate) {
      setMessage("Erreur : Un joueur avec ce nom ou ce numéro existe déjà dans votre équipe.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/coach/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Joueur ajouté avec succès !");
        (e.target as HTMLFormElement).reset();
        router.refresh();
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

  return (
    <div className="space-y-4">
      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${message.includes("succès") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}>
          <CheckCircle2 size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            <User size={12} />
            Prénom
          </label>
          <input name="firstName" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Prénom" />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            <User size={12} />
            Nom
          </label>
          <input name="lastName" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Nom" />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            <Hash size={12} />
            Numéro
          </label>
          <input name="number" type="number" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="7" />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            <UserPlus size={12} />
            Poste
          </label>
          <select name="position" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white focus:border-cyan-500/50 outline-none">
            <option value="">Poste</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            <User size={12} />
            Photo
          </label>
          <input 
            type="file" 
            name="photoFile" 
            accept="image/*"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-1.5 text-[10px] text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:text-cyan-500 hover:file:bg-zinc-700 transition-all outline-none" 
          />
        </div>
        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
          <button
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-8 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-600/20"
          >
            <Plus size={14} />
            {loading ? "Chargement..." : "Enregistrer le Joueur"}
          </button>
        </div>
      </form>
    </div>
  );
}
