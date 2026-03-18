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
      name: String(formData.get("name") ?? ""),
      colors: String(formData.get("colors") ?? ""),
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

  async function handleCreatePlayer(formData: FormData) {
    const file = formData.get("photoFile") as File;
    let photoUrl = "";
    if (file && file.size > 0) {
      photoUrl = (await uploadFile(file)) || "";
    }

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      number: Number(formData.get("number") ?? 0),
      position: String(formData.get("position") ?? ""),
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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-lg shadow-cyan-500/10">
      <h2 className="text-xl font-semibold text-cyan-300">IAI Inter-Classe Master</h2>
      <p className="mt-1 text-sm text-zinc-400">Administration du tournoi et feuille de match numérique.</p>
      {message ? (
        <div className="mt-3 rounded-lg bg-zinc-900 border border-zinc-800 p-3 flex justify-between items-center">
          <p className="text-sm text-cyan-200">{message}</p>
          <button onClick={() => setMessage("")} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      ) : null}
      
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {/* Gestion des Équipes */}
        <div className="space-y-4">
          <form
            className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            action={(formData) => startTransition(() => handleCreateTeam(formData))}
          >
            <h3 className="font-medium text-zinc-100">Créer une équipe</h3>
            <input name="name" required placeholder="Ex: Terminale C4" className="w-full rounded bg-zinc-800 p-2 text-sm text-white" />
            <input name="colors" placeholder="Couleurs (Bleu / Blanc)" className="w-full rounded bg-zinc-800 p-2 text-sm text-white" />
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Logo de l'équipe</label>
              <input name="logoFile" type="file" accept="image/*" className="w-full text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-cyan-400 hover:file:bg-zinc-700" />
            </div>
            <button disabled={isPending || isUploading} className="w-full rounded bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors disabled:opacity-50">
              {isUploading ? "Téléchargement..." : "Enregistrer l'équipe"}
            </button>
          </form>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="font-medium text-zinc-100 mb-2">Équipes existantes</h3>
            <div className="max-h-40 overflow-auto space-y-1">
              {teams.map(team => (
                <div key={team.id} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded text-sm">
                  <span>{team.name} ({team.players.length} joueurs)</span>
                  <button 
                    onClick={() => startTransition(() => handleDeleteTeam(team.id))}
                    className="text-rose-400 hover:text-rose-300 text-xs"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gestion des Joueurs */}
        <form
          className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          action={(formData) => startTransition(() => handleCreatePlayer(formData))}
        >
          <h3 className="font-medium text-zinc-100">Ajouter un joueur</h3>
          <select
            className="w-full rounded bg-zinc-800 p-2 text-sm text-white"
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
          >
            <option value="">Sélectionner une équipe</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="firstName" required placeholder="Prénom" className="rounded bg-zinc-800 p-2 text-sm text-white" />
            <input name="lastName" required placeholder="Nom" className="rounded bg-zinc-800 p-2 text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="number" type="number" required placeholder="Numéro" className="rounded bg-zinc-800 p-2 text-sm text-white" />
            <select name="position" className="rounded bg-zinc-800 p-2 text-sm text-zinc-300">
              <option value="">Choisir un poste</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Photo du joueur</label>
            <input name="photoFile" type="file" accept="image/*" className="w-full text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-cyan-400 hover:file:bg-zinc-700" />
          </div>
          <button disabled={isPending || !selectedTeam || isUploading} className="w-full rounded bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors disabled:opacity-50">
            {isUploading ? "Téléchargement..." : "Ajouter au club"}
          </button>
          
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Effectif actuel</h4>
            <div className="max-h-32 overflow-auto space-y-1">
              {teamPlayers.map((player) => (
                <div key={player.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    {player.photoUrl && <img src={player.photoUrl} className="w-5 h-5 rounded-full object-cover" />}
                    <span className="text-xs text-zinc-400">#{player.number} {player.firstName} {player.lastName}</span>
                  </div>
                  <button 
                    onClick={() => startTransition(() => handleDeletePlayer(player.id))}
                    className="text-rose-500/50 hover:text-rose-500 text-[10px]"
                    type="button"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Planification des Matchs */}
        <div className="space-y-4">
          <form
            className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            action={(formData) => startTransition(() => handleCreateMatch(formData))}
          >
            <h3 className="font-medium text-zinc-100">Planifier un match</h3>
            <div className="grid grid-cols-2 gap-2">
              <select name="teamAId" required className="w-full rounded bg-zinc-800 p-2 text-sm text-white">
                <option value="">Équipe A</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <select name="teamBId" required className="w-full rounded bg-zinc-800 p-2 text-sm text-white">
                <option value="">Équipe B</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <input name="date" required type="datetime-local" className="w-full rounded bg-zinc-800 p-2 text-sm text-white" />
            <button disabled={isPending} className="w-full rounded bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors">
              Ajouter au calendrier
            </button>
          </form>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="font-medium text-zinc-100 mb-2">Matchs programmés</h3>
            <div className="max-h-40 overflow-auto space-y-1 text-sm">
              {matches.map(match => (
                <div key={match.id} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                  <span className={`text-xs ${match.status === MatchStatus.LIVE ? "text-cyan-400" : match.status === MatchStatus.FINI ? "text-zinc-500" : ""}`}>
                    {match.teamA.name} vs {match.teamB.name} {match.status === MatchStatus.FINI ? "(Terminé)" : ""}
                  </span>
                  <button 
                    onClick={() => startTransition(() => handleDeleteMatch(match.id))}
                    className="text-rose-400 hover:text-rose-300 text-[10px]"
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feuille de Match (CRUD Événements) */}
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="font-medium text-zinc-100">Feuille de match dynamique</h3>
          <select
            value={selectedMatch}
            onChange={(event) => setSelectedMatch(event.target.value)}
            className="w-full rounded bg-zinc-800 p-2 text-sm border-cyan-500/30 border text-white"
          >
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.teamA.name} - {match.teamB.name} ({new Date(match.date).toLocaleDateString()}) {match.status === MatchStatus.FINI ? "🏁" : ""}
              </option>
            ))}
          </select>
          
          {isFinished && (
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2 text-center">
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Match Terminé & Validé</span>
            </div>
          )}

          {!isFinished && (
            <div className="flex gap-2">
              <button
                disabled={isPending || !selectedMatch || (selectedMatchData && new Date(selectedMatchData.date) > new Date())}
                onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.LIVE))}
                className="flex-1 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                type="button"
              >
                Lancer le Match
              </button>
              <button
                disabled={isPending || !selectedMatch}
                onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.PREVU))}
                className="flex-1 rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                type="button"
              >
                Pause
              </button>
            </div>
          )}
          {selectedMatchData && new Date(selectedMatchData.date) > new Date() && (
            <p className="text-[10px] text-zinc-500 italic">Le match ne peut être lancé qu'à partir du {new Date(selectedMatchData.date).toLocaleString()}</p>
          )}

          <form className="space-y-2 pt-2 border-t border-zinc-800" action={(formData) => startTransition(() => handleAddEvent(formData))}>
            <div className="grid grid-cols-2 gap-2">
              <select name="type" className="rounded bg-zinc-800 p-2 text-sm text-white">
                {Object.values(EventType).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input name="minute" type="number" placeholder="Min" defaultValue={selectedMatchData?.liveMinute ?? 0} className="rounded bg-zinc-800 p-2 text-sm text-white" />
            </div>
            <select name="playerId" required className="w-full rounded bg-zinc-800 p-2 text-sm text-white">
              <option value="">Joueur principal</option>
              {playersForMatch.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.number} {player.firstName} {player.lastName}
                </option>
              ))}
            </select>
            <button disabled={isPending || !selectedMatch || selectedMatchData?.status !== MatchStatus.LIVE || isFinished} className="w-full rounded bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors disabled:opacity-50">
              Enregistrer l'action
            </button>
          </form>

          {/* Liste des événements du match (DELETE) */}
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Historique des actions</h4>
            <div className="max-h-40 overflow-auto space-y-1">
              {selectedMatchData?.events.map((event) => (
                <div key={event.id} className="flex justify-between items-center text-xs bg-zinc-950 p-2 rounded">
                  <span>{event.minute}' <b>{event.type}</b> - {event.player.firstName} {event.player.lastName}</span>
                  {!isFinished && (
                    <button 
                      onClick={() => startTransition(() => handleDeleteEvent(event.id))}
                      className="text-rose-500 hover:text-rose-400"
                      type="button"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form className="space-y-2 pt-4" action={(formData) => startTransition(() => handleFinalize(formData))}>
            <div className="grid grid-cols-2 gap-2">
              <input name="scoreA" type="number" defaultValue={selectedMatchData?.scoreA ?? 0} disabled={isFinished} className="rounded bg-zinc-800 p-2 text-sm text-white disabled:opacity-50" />
              <input name="scoreB" type="number" defaultValue={selectedMatchData?.scoreB ?? 0} disabled={isFinished} className="rounded bg-zinc-800 p-2 text-sm text-white disabled:opacity-50" />
            </div>
            {!isFinished && (
              <button disabled={isPending || !selectedMatch} className="w-full rounded bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Valider Score Final
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
