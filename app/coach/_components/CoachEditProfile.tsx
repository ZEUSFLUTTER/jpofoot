"use client";

import { useState } from "react";
import { X, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

// Extracted from CoachEditTeam props layout
type Team = {
  id: string;
  name: string;
  coachFirstName?: string;
  coachLastName?: string;
  coachPhotoUrl?: string | null;
  [key: string]: any;
};

export function CoachEditProfile({ team }: { team: Team }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);

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
    let coachPhotoUrl = team.coachPhotoUrl;

    if (file && file.size > 0) {
      const uploadedUrl = await uploadFile(file);
      if (uploadedUrl) {
        coachPhotoUrl = uploadedUrl;
      } else {
        setLoading(false);
        return;
      }
    }

    const payload = {
      coachPhotoUrl,
    };

    try {
      // PATCH to the team admin endpoint
      const res = await fetch(`/api/coach/equipes/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Photo de profil mise à jour !");
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
        className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-xs font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-lg active:scale-95"
      >
        Éditer ma photo de profil
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/50 bg-zinc-950 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Ma Photo</h3>
          <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border p-4 text-center ${message.includes("mise à jour") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}>
            <p className="text-xs font-black uppercase tracking-widest">{message}</p>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-inner">
            {team.coachPhotoUrl ? (
              <img src={team.coachPhotoUrl} alt="Coach" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-800">
                <UploadCloud size={32} />
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Photo de profil (Sélect.)</label>
            <input 
              type="file" 
              name="photoFile" 
              accept="image/*"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:text-cyan-500 hover:file:bg-zinc-700 transition-all outline-none" 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Annuler</button>
            <button
              disabled={loading || isUploading}
              className="flex-1 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {isUploading ? "Upload..." : loading ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
