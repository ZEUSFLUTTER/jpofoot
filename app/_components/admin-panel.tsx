"use client";

import { EventType, MatchStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  teamId: string;
  position?: string | null;
  photoUrl?: string | null;
  stats?: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  } | null;
};

type Team = {
  id: string;
  name: string;
  logoUrl?: string | null;
  colors?: string | null;
  coachFirstName?: string;
  coachLastName?: string;
  players: Player[];
};

type MatchEvent = {
  id: string;
  type: EventType;
  minute: number;
  player: { id: string; firstName: string; lastName: string; teamId: string };
};

type Match = {
  id: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  liveMinute: number;
  date: string | Date;
  teamA: { name: string };
  teamB: { name: string };
  events: MatchEvent[];
};

type Props = {
  teams: Team[];
  matches: Match[];
};

export function AdminPanel({ teams, matches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id ?? "");
  const [selectedMatch, setSelectedMatch] = useState(matches[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const teamPlayers = useMemo(
    () => teams.find((team) => team.id === selectedTeam)?.players ?? [],
    [teams, selectedTeam],
  );

  const selectedMatchData = useMemo(
    () => matches.find((match) => match.id === selectedMatch),
    [matches, selectedMatch],
  );

  const isFinished = selectedMatchData?.status === MatchStatus.FINI;

  const playersForMatch = useMemo(() => {
    if (!selectedMatchData) {
      return [];
    }
    const teamAPlayers = teams.find((team) => team.id === selectedMatchData.teamAId)?.players ?? [];
    const teamBPlayers = teams.find((team) => team.id === selectedMatchData.teamBId)?.players ?? [];
    return [...teamAPlayers, ...teamBPlayers];
  }, [teams, selectedMatchData]);

  async function uploadFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
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

  async function handleCreateTeam(formData: FormData) {
    const file = formData.get("logoFile") as File;
    let logoUrl = "";
    if (file && file.size > 0) {
      logoUrl = (await uploadFile(file)) || "";
    }

    const payload = {
      name: (formData.get("name") as string)?.trim() || "",
      colors: (formData.get("colors") as string)?.trim() || "",
      coachFirstName: (formData.get("coachFirstName") as string)?.trim() || "",
      coachLastName: (formData.get("coachLastName") as string)?.trim() || "",
      logoUrl: logoUrl,
    };
    const response = await fetch("/api/admin/equipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Erreur lors de la création de l’équipe");
      return;
    }
    setMessage("Équipe créée");
    router.refresh();
  }

  async function handleDeleteTeam(id: string) {
    if (!confirm("Supprimer cette équipe ?")) return;
    const response = await fetch(`/api/admin/equipes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error);
      return;
    }
    setMessage("Équipe supprimée");
    router.refresh();
  }
  
  async function handleUpdateTeam(formData: FormData) {
    if (!editingTeam) return;
    const file = formData.get("logoFile") as File;
    let logoUrl = editingTeam.logoUrl || "";
    if (file && file.size > 0) {
      logoUrl = (await uploadFile(file)) || logoUrl;
    }

    const payload = {
      name: String(formData.get("name") ?? ""),
      colors: String(formData.get("colors") ?? ""),
      coachFirstName: String(formData.get("coachFirstName") ?? ""),
      coachLastName: String(formData.get("coachLastName") ?? ""),
      logoUrl: logoUrl,
    };
    const response = await fetch(`/api/admin/equipes/${editingTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur lors de la modification");
      return;
    }
    setMessage("Équipe modifiée");
    setEditingTeam(null);
    router.refresh();
  }

  async function handleCreatePlayer(formData: FormData) {
    const file = formData.get("photoFile") as File;
    let photoUrl = "";
    if (file && file.size > 0) {
      photoUrl = (await uploadFile(file)) || "";
    }

    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      number: Number(formData.get("number") ?? 0),
      position: String(formData.get("position") ?? "").trim(),
      photoUrl: photoUrl,
      teamId: selectedTeam,
    };
    const response = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Erreur lors de l’ajout du joueur");
      return;
    }
    setMessage("Joueur ajouté");
    router.refresh();
  }

  async function handleDeletePlayer(id: string) {
    if (!confirm("Supprimer ce joueur ?")) return;
    const response = await fetch(`/api/admin/players/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Erreur lors de la suppression");
      return;
    }
    setMessage("Joueur supprimé");
    router.refresh();
  }

  async function handleUpdatePlayer(formData: FormData) {
    if (!editingPlayer) return;
    const file = formData.get("photoFile") as File;
    let photoUrl = editingPlayer.photoUrl || "";
    if (file && file.size > 0) {
      photoUrl = (await uploadFile(file)) || photoUrl;
    }

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      number: Number(formData.get("number") ?? 0),
      position: String(formData.get("position") ?? ""),
      photoUrl: photoUrl,
      teamId: editingPlayer.teamId,
    };
    const response = await fetch(`/api/admin/players/${editingPlayer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur lors de la modification");
      return;
    }
    setMessage("Joueur modifié");
    setEditingPlayer(null);
    router.refresh();
  }

  async function handleCreateMatch(formData: FormData) {
    const payload = {
      teamAId: String(formData.get("teamAId") ?? ""),
      teamBId: String(formData.get("teamBId") ?? ""),
      date: new Date(String(formData.get("date") ?? "")).toISOString(),
    };
    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Erreur lors de la planification");
      return;
    }
    setMessage("Match planifié");
    router.refresh();
  }

  async function handleDeleteMatch(id: string) {
    if (!confirm("Supprimer ce match ?")) return;
    const response = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Erreur lors de la suppression");
      return;
    }
    setMessage("Match supprimé");
    router.refresh();
  }

  async function handleUpdateStatus(status: MatchStatus) {
    if (!selectedMatch) return;
    const response = await fetch(`/api/admin/matches/${selectedMatch}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Erreur lors de la mise à jour du statut");
      return;
    }
    setMessage("Statut du match mis à jour");
    router.refresh();
  }

  async function handleAddEvent(formData: FormData) {
    if (!selectedMatch) return;
    const payload = {
      type: String(formData.get("type") ?? EventType.GOAL),
      playerId: String(formData.get("playerId") ?? ""),
      relatedToId: String(formData.get("relatedToId") ?? ""),
      minute: Number(formData.get("minute") ?? 0),
    };
    const response = await fetch(`/api/admin/matches/${selectedMatch}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Erreur lors de l’ajout de l’événement");
      return;
    }
    setMessage("Événement ajouté");
    router.refresh();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    const response = await fetch(`/api/admin/matches/${selectedMatch}/event/${eventId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage("Erreur lors de la suppression");
      return;
    }
    setMessage("Événement supprimé");
    router.refresh();
  }

  async function handleFinalize(formData: FormData) {
    if (!selectedMatchData) return;
    const payload = {
      scoreA: Number(formData.get("scoreA") ?? selectedMatchData.scoreA),
      scoreB: Number(formData.get("scoreB") ?? selectedMatchData.scoreB),
    };
    const response = await fetch(`/api/admin/matches/${selectedMatchData.id}/finalize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur lors de la validation du score");
      return;
    }
    setMessage("Score final validé");
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl font-primary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-cyan-300">Portail Administration</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500 uppercase tracking-widest">Gestion du tournoi et feuille de match numérique.</p>
        </div>
        {message && (
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <p className="text-sm font-black uppercase tracking-widest text-cyan-400">{message}</p>
            <button onClick={() => setMessage("")} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>
        )}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Teams & Players management column */}
        <div className="space-y-8 h-full">
          {/* Creation Forms */}
          <div className="grid gap-6 sm:grid-cols-2 items-stretch">
            <form
              className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
              action={(formData) => startTransition(() => handleCreateTeam(formData))}
            >
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Créer une équipe</h3>
              <input name="name" required placeholder="Nom de l'équipe" className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700" />
              <div className="grid grid-cols-2 gap-2">
                <input name="coachFirstName" required placeholder="Prénom Coach" className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700" />
                <input name="coachLastName" required placeholder="Nom Coach" className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700" />
              </div>
              <button disabled={isPending || isUploading} className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 active:scale-95">
                {isUploading ? "Téléchargement..." : "Créer l'équipe"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
              action={(formData) => startTransition(() => handleCreatePlayer(formData))}
            >
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Ajouter un joueur</h3>
              <select
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none appearance-none"
                value={selectedTeam}
                onChange={(event) => setSelectedTeam(event.target.value)}
              >
                <option value="">Sélectionner une équipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="firstName" required placeholder="Prénom" className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700" />
                <input name="lastName" required placeholder="Nom" className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700" />
              </div>
              <button disabled={isPending || !selectedTeam || isUploading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95">
                {isUploading ? "Téléchargement..." : "Ajouter au club"}
              </button>
            </form>
          </div>

          {/* List & Edit Area */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Parcourir les clubs</h3>
              <div className="max-h-[300px] overflow-auto space-y-2 pr-2 custom-scrollbar">
                {teams.map(team => (
                  <div key={team.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-2xl hover:border-cyan-500/30 transition-all group">
                    <div>
                      <p className="font-black text-white uppercase text-xs tracking-tight">{team.name}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">{team.coachFirstName} {team.coachLastName}</p>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => setEditingTeam(team)} className="text-[10px] font-black uppercase text-cyan-500 hover:text-cyan-400 transition-colors">Éditer</button>
                       <button onClick={() => startTransition(() => handleDeleteTeam(team.id))} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Suppr.</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Liste des joueurs</h3>
                 <span className="text-[10px] font-black text-cyan-500/50 uppercase">{teamPlayers.length} j.</span>
              </div>
              <div className="max-h-[300px] overflow-auto space-y-2 pr-2 custom-scrollbar">
                {teamPlayers.length === 0 ? (
                  <p className="text-center py-10 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Aucune équipe sélectionnée</p>
                ) : (
                  teamPlayers.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-2xl group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black italic text-zinc-800 group-hover:text-emerald-500/50 transition-colors tabular-nums">#{player.number}</span>
                        <div>
                           <p className="font-black text-white uppercase text-xs tracking-tight">{player.firstName} {player.lastName}</p>
                           <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{player.position || "Non assigné"}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                         <button onClick={() => setEditingPlayer(player)} className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 transition-colors">Éditer</button>
                         <button onClick={() => startTransition(() => handleDeletePlayer(player.id))} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Virer</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Match Control Column */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Contrôle de Match</h3>
             </div>
             
             <select
                value={selectedMatch}
                onChange={(event) => setSelectedMatch(event.target.value)}
                className="w-full rounded-2xl bg-zinc-950 border-2 border-cyan-500/20 p-4 text-sm font-black uppercase tracking-widest text-white focus:border-cyan-500 outline-none mb-6 relative z-10"
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.teamA.name} VS {match.teamB.name} — {new Date(match.date).toLocaleDateString()}
                  </option>
                ))}
              </select>

              {!isFinished ? (
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      disabled={isPending || !selectedMatch || (selectedMatchData && new Date(selectedMatchData.date) > new Date())}
                      onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.LIVE))}
                      className="flex h-16 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-30"
                    >
                      Démarrer Live
                    </button>
                    <button
                      disabled={isPending || !selectedMatch}
                      onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.PREVU))}
                      className="flex h-16 items-center justify-center rounded-2xl bg-amber-600 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-amber-500 shadow-xl shadow-amber-600/20 transition-all active:scale-95 disabled:opacity-30"
                    >
                      Mettre en Pause
                    </button>
                 </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center mb-8">
                   <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-sm italic">Match Officiellement Terminé</p>
                </div>
              )}

              {/* Event Adding Form */}
              <form className="space-y-4 pt-6 border-t border-zinc-800" action={(formData) => startTransition(() => handleAddEvent(formData))}>
                 <div className="grid grid-cols-3 gap-3">
                   <select name="type" className="col-span-2 rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold uppercase text-white outline-none">
                      {Object.values(EventType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <input name="minute" type="number" placeholder="Min" defaultValue={selectedMatchData?.liveMinute ?? 0} className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs font-black text-white outline-none text-center" />
                 </div>
                 <select name="playerId" required className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold uppercase text-white outline-none">
                  <option value="">Sélectionner l'acteur</option>
                  {playersForMatch.map((player) => (
                    <option key={player.id} value={player.id}>#{player.number} {player.firstName} {player.lastName}</option>
                  ))}
                 </select>
                 <button disabled={isPending || !selectedMatch || selectedMatchData?.status !== MatchStatus.LIVE || isFinished} className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-cyan-500 shadow-xl shadow-cyan-600/20 transition-all active:scale-95 disabled:opacity-30">
                    Enregistrer Action Live
                 </button>
              </form>

              {/* Event List */}
              <div className="mt-8 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Flux des événements</h4>
                <div className="max-h-[250px] overflow-auto space-y-2 custom-scrollbar pr-2">
                   {selectedMatchData?.events.map((event) => (
                     <div key={event.id} className="flex justify-between items-center text-[11px] bg-zinc-950 p-4 rounded-xl border border-zinc-900 group">
                        <span className="font-bold text-zinc-300">
                           <span className="text-cyan-500 mr-2 italic">{event.minute}&apos;</span>
                           <b className="uppercase tracking-widest mr-1">{event.type}</b> — {event.player.firstName} {event.player.lastName}
                        </span>
                        {!isFinished && (
                          <button onClick={() => startTransition(() => handleDeleteEvent(event.id))} className="text-rose-500 font-black opacity-0 group-hover:opacity-100 transition-opacity">EXCLURE</button>
                        )}
                     </div>
                   ))}
                </div>
              </div>

              {/* Score Validation */}
              <form className="mt-10 pt-8 border-t border-zinc-800 space-y-4" action={(formData) => startTransition(() => handleFinalize(formData))}>
                 <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{selectedMatchData?.teamA.name}</p>
                       <input name="scoreA" type="number" defaultValue={selectedMatchData?.scoreA ?? 0} disabled={isFinished} className="w-20 h-20 rounded-2xl bg-zinc-950 border-4 border-zinc-800 text-center text-3xl font-black text-white outline-none focus:border-cyan-500 transition-all" />
                    </div>
                    <span className="text-3xl font-light text-zinc-800">-</span>
                    <div className="text-center">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{selectedMatchData?.teamB.name}</p>
                       <input name="scoreB" type="number" defaultValue={selectedMatchData?.scoreB ?? 0} disabled={isFinished} className="w-20 h-20 rounded-2xl bg-zinc-950 border-4 border-zinc-800 text-center text-3xl font-black text-white outline-none focus:border-cyan-500 transition-all" />
                    </div>
                 </div>
                 {!isFinished && (
                    <button disabled={isPending || !selectedMatch} className="w-full rounded-3xl bg-rose-600 px-6 py-5 text-sm font-black uppercase tracking-[0.4em] text-white hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all active:scale-95">
                       Clôturer & Valider Officiellement
                    </button>
                 )}
              </form>
          </div>
        </div>
      </div>

      {/* Editing Overlays */}
      {editingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <form action={(formData) => startTransition(() => handleUpdateTeam(formData))} className="w-full max-w-lg bg-zinc-950 border border-cyan-500/30 p-10 rounded-[3rem] shadow-3xl space-y-6">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Éditer le Club</h2>
                 <button type="button" onClick={() => setEditingTeam(null)} className="text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Appellation Officielle</label>
                    <input name="name" required defaultValue={editingTeam.name} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-cyan-500 transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prénom Coach</label>
                       <input name="coachFirstName" required defaultValue={editingTeam.coachFirstName} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-cyan-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nom Coach</label>
                       <input name="coachLastName" required defaultValue={editingTeam.coachLastName} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-cyan-500 transition-all" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Couleurs Distinctives</label>
                    <input name="colors" defaultValue={editingTeam.colors || ""} placeholder="Ex: Rouge & Or" className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-cyan-500 transition-all" />
                 </div>
              </div>
              <button disabled={isPending || isUploading} className="w-full rounded-[2rem] bg-cyan-600 px-6 py-5 text-sm font-black uppercase tracking-[0.3em] text-white hover:bg-cyan-500 transition-all shadow-2xl shadow-cyan-600/40">
                 Finaliser les Changements
              </button>
           </form>
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <form action={(formData) => startTransition(() => handleUpdatePlayer(formData))} className="w-full max-w-lg bg-zinc-950 border border-emerald-500/30 p-10 rounded-[3rem] shadow-3xl space-y-6">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Éditer Profil</h2>
                 <button type="button" onClick={() => setEditingPlayer(null)} className="text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prénom</label>
                       <input name="firstName" required defaultValue={editingPlayer.firstName} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nom de Famille</label>
                       <input name="lastName" required defaultValue={editingPlayer.lastName} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Dossard #</label>
                       <input name="number" type="number" required defaultValue={editingPlayer.number} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Position</label>
                       <select name="position" defaultValue={editingPlayer.position || ""} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-white outline-none focus:border-emerald-500 appearance-none">
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
              <button disabled={isPending || isUploading} className="w-full rounded-[2rem] bg-emerald-600 px-6 py-5 text-sm font-black uppercase tracking-[0.3em] text-white hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/40">
                 Confirmer Profil Joueur
              </button>
           </form>
        </div>
      )}
    </section>
  );
}
