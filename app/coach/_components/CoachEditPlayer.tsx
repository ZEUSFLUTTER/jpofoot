"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
];

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position?: string | null;
  photoUrl?: string | null;
};

export function CoachEditPlayer({ player, onCancel }: { player: Player; onCancel: () => void }) {
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
    let photoUrl = player.photoUrl;

    if (file && file.size > 0) {
      const uploadedUrl = await uploadFile(file);
      if (uploadedUrl) {
        photoUrl = uploadedUrl;
      } else {
        setLoading(false);
        return;
      }
    }

    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      number: Number(formData.get("number")),
      position: formData.get("position"),
      photoUrl,
    };

    try {
      const res = await fetch(`/api/coach/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Joueur mis à jour !");
        setTimeout(() => {
          onCancel();
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

  return (
    <div className="rounded-2xl border border-cyan-500/50 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Modifier le Joueur</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">✕</button>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl border p-4 text-center ${message.includes("mis à jour") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}>
          <p className="text-xs font-black uppercase tracking-widest">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Prénom</label>
            <input name="firstName" required defaultValue={player.firstName} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Nom</label>
            <input name="lastName" required defaultValue={player.lastName} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Numéro</label>
            <input name="number" type="number" required defaultValue={player.number} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Poste</label>
            <select name="position" defaultValue={player.position || ""} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all">
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Photo (optionnel)</label>
          <input 
            type="file" 
            name="photoFile" 
            accept="image/*"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-[10px] text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:text-cyan-500 hover:file:bg-zinc-700 transition-all outline-none" 
          />
        </div>
        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Annuler</button>
          <button
            disabled={loading}
            className="flex-1 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
          >
            {loading ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
