"use client";

import { EventType, MatchStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

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

type TabId = "overview" | "teams" | "matches";

export function AdminPanel({ teams, matches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Memoized data
  const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);
  const selectedMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);
  
  const playersForMatch = useMemo(() => {
    if (!selectedMatch) return [];
    const teamAPlayers = teams.find(t => t.id === selectedMatch.teamAId)?.players ?? [];
    const teamBPlayers = teams.find(t => t.id === selectedMatch.teamBId)?.players ?? [];
    return [...teamAPlayers, ...teamBPlayers];
  }, [teams, selectedMatch]);

  // Handlers (API Logic)
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

  async function handleCreateTeam(formData: FormData) {
    const file = formData.get("logoFile") as File;
    let logoUrl = "";
    if (file && file.size > 0) logoUrl = (await uploadFile(file)) || "";

    const payload = {
      name: (formData.get("name") as string)?.trim() || "",
      colors: (formData.get("colors") as string)?.trim() || "",
      coachFirstName: (formData.get("coachFirstName") as string)?.trim() || "",
      coachLastName: (formData.get("coachLastName") as string)?.trim() || "",
      logoUrl,
    };
    const response = await fetch("/api/admin/equipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur création");
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
    if (file && file.size > 0) logoUrl = (await uploadFile(file)) || logoUrl;

    const payload = {
      name: (formData.get("name") as string)?.trim() || "",
      colors: (formData.get("colors") as string)?.trim() || "",
      coachFirstName: (formData.get("coachFirstName") as string)?.trim() || "",
      coachLastName: (formData.get("coachLastName") as string)?.trim() || "",
      logoUrl,
    };
    const response = await fetch(`/api/admin/equipes/${editingTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur lors de la modification");
      return;
    }
    setMessage("Équipe modifiée");
    setEditingTeam(null);
    router.refresh();
  }

  async function handleCreatePlayer(formData: FormData) {
    const file = formData.get("photoFile") as File;
    let photoUrl = "";
    if (file && file.size > 0) photoUrl = (await uploadFile(file)) || "";

    const payload = {
      firstName: (formData.get("firstName") as string)?.trim() || "",
      lastName: (formData.get("lastName") as string)?.trim() || "",
      number: Number(formData.get("number") ?? 0),
      position: (formData.get("position") as string)?.trim() || "",
      photoUrl,
      teamId: selectedTeamId,
    };
    const response = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur lors de l’ajout");
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
    if (file && file.size > 0) photoUrl = (await uploadFile(file)) || photoUrl;

    const payload = {
      firstName: (formData.get("firstName") as string)?.trim() || "",
      lastName: (formData.get("lastName") as string)?.trim() || "",
      number: Number(formData.get("number") ?? 0),
      position: (formData.get("position") as string)?.trim() || "",
      photoUrl,
      teamId: editingPlayer.teamId,
    };
    const response = await fetch(`/api/admin/players/${editingPlayer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur lors de la modification");
      return;
    }
    setMessage("Joueur modifié");
    setEditingPlayer(null);
    router.refresh();
  }

  async function handleUpdateStatus(status: MatchStatus) {
    if (!selectedMatchId) return;
    const response = await fetch(`/api/admin/matches/${selectedMatchId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setMessage("Erreur lors de la mise à jour");
      return;
    }
    setMessage("Statut mis à jour");
    router.refresh();
  }

  async function handleAddEvent(formData: FormData) {
    if (!selectedMatchId) return;
    const payload = {
      type: String(formData.get("type") ?? EventType.GOAL),
      playerId: String(formData.get("playerId") ?? ""),
      minute: Number(formData.get("minute") ?? 0),
    };
    const response = await fetch(`/api/admin/matches/${selectedMatchId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur événement");
      return;
    }
    setMessage("Événement ajouté");
    router.refresh();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    const response = await fetch(`/api/admin/matches/${selectedMatchId}/event/${eventId}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Erreur lors de la suppression");
      return;
    }
    setMessage("Événement supprimé");
    router.refresh();
  }

  async function handleFinalize(formData: FormData) {
    if (!selectedMatch) return;
    const payload = {
      scoreA: Number(formData.get("scoreA") ?? selectedMatch.scoreA),
      scoreB: Number(formData.get("scoreB") ?? selectedMatch.scoreB),
    };
    const response = await fetch(`/api/admin/matches/${selectedMatch.id}/finalize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur score");
      return;
    }
    setMessage("Match clôturé");
    router.refresh();
  }

  async function handleCreateMatch(formData: FormData) {
    const payload = {
      teamAId: String(formData.get("teamAId") ?? ""),
      teamBId: String(formData.get("teamBId") ?? ""),
      date: String(formData.get("date") ?? ""),
    };
    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur création match");
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

  // Sidebar Component
  const SidebarItem = ({ id, label, icon }: { id: TabId; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-4 transition-all duration-300 rounded-2xl",
        activeTab === id 
          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl font-primary">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-zinc-900/30 p-6 border-r border-zinc-800 flex flex-col gap-8">
        <div className="px-4 py-2">
           <h2 className="text-2xl font-black uppercase italic tracking-tighter text-cyan-500">IAI Admin</h2>
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Tournament Manager</p>
        </div>
        
        <nav className="flex flex-col gap-2">
          <SidebarItem id="overview" label="Dashboard" icon="📊" />
          <SidebarItem id="teams" label="Équipes & Joueurs" icon="⚽" />
          <SidebarItem id="matches" label="Gestion Matchs" icon="⏱️" />
        </nav>

        <div className="mt-auto p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
           <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Statut Système</p>
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest leading-none">Cloud Sync Live</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto custom-scrollbar relative">
        {/* Banner/Notification Area */}
        {message && (
          <div className="absolute top-8 right-8 z-50 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">{message}</p>
            <button onClick={() => setMessage("")} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>
        )}

        {/* Tab Content: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header>
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Tableau de Bord</h3>
               <p className="text-sm text-zinc-500 font-medium tracking-tight">Vue d'ensemble et statistiques rapides du tournoi.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Clubs Engagés</p>
                  <p className="text-4xl font-black text-white">{teams.length}</p>
               </div>
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Matchs Joués</p>
                  <p className="text-4xl font-black text-white">{matches.filter(m => m.status === MatchStatus.FINI).length}</p>
               </div>
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Total Joueurs</p>
                  <p className="text-4xl font-black text-white">{teams.reduce((acc, t) => acc + t.players.length, 0)}</p>
               </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
               <h4 className="text-lg font-black uppercase italic tracking-tighter text-white mb-6">Dernières Activités</h4>
               <div className="space-y-4">
                  {matches.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 hover:border-zinc-700 transition-colors">
                       <span className="text-xs font-black uppercase text-zinc-300">{m.teamA.name} <b className="text-cyan-500 mx-2">VS</b> {m.teamB.name}</span>
                       <span className={cn(
                         "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                         m.status === MatchStatus.FINI ? "bg-zinc-800 text-zinc-500" : "bg-emerald-500/10 text-emerald-500"
                       )}>
                         {m.status}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Tab Content: TEAMS & PLAYERS */}
        {activeTab === "teams" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header className="flex justify-between items-center">
               <div>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Clubs & Joueurs</h3>
                  <p className="text-sm text-zinc-500 font-medium tracking-tight">Gérez les effectifs et les informations des équipes.</p>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
               {/* Team Management */}
               <div className="space-y-6">
                  <form 
                    action={(fd) => startTransition(() => handleCreateTeam(fd))}
                    className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4"
                  >
                     <h4 className="text-sm font-black uppercase tracking-widest text-white">Nouveau Club</h4>
                     <input name="name" required placeholder="Nom de l'équipe" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                     <div className="grid grid-cols-2 gap-2">
                        <input name="coachFirstName" required placeholder="Prénom Coach" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                        <input name="coachLastName" required placeholder="Nom Coach" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                     </div>
                     <button disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95">Créer Équipe</button>
                  </form>

                  <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800">
                           <tr>
                              <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Équipe</th>
                              <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Entraîneur</th>
                              <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                           {teams.map(t => (
                             <tr key={t.id} className={cn("hover:bg-zinc-900/30 transition-colors group", selectedTeamId === t.id && "bg-cyan-500/5")}>
                                <td className="p-4 cursor-pointer" onClick={() => setSelectedTeamId(t.id)}>
                                   <p className="text-xs font-black uppercase text-white truncate">{t.name}</p>
                                </td>
                                <td className="p-4">
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase">{t.coachFirstName} {t.coachLastName}</p>
                                </td>
                                <td className="p-4 text-right">
                                   <div className="flex justify-end gap-3">
                                      <button onClick={() => setEditingTeam(t)} className="text-[10px] font-black text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">EDIT</button>
                                      <button onClick={() => startTransition(() => handleDeleteTeam(t.id))} className="text-[10px] font-black text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">DEL</button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* Player Management */}
               <div className="space-y-6">
                  <form 
                    action={(fd) => startTransition(() => handleCreatePlayer(fd))}
                    className="p-6 rounded-2xl bg-zinc-800/20 border border-zinc-800 space-y-4"
                  >
                     <h4 className="text-sm font-black uppercase tracking-widest text-white">Ajouter Joueur à <span className="text-cyan-500">{selectedTeam?.name || "..."}</span></h4>
                     <div className="grid grid-cols-2 gap-2">
                        <input name="firstName" required placeholder="Prénom" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                        <input name="lastName" required placeholder="Nom" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input name="number" type="number" required placeholder="Numéro #" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                        <select name="position" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                           {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                     <button disabled={isPending || !selectedTeamId} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 disabled:opacity-30">Inscrire Joueur</button>
                  </form>

                  <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                     <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Effectif: {selectedTeam?.name}</h4>
                        <span className="text-[10px] font-black text-cyan-500">{selectedTeam?.players.length || 0} JOUEURS</span>
                     </div>
                     <div className="max-h-[400px] overflow-auto custom-scrollbar">
                        <table className="w-full text-left">
                           <tbody className="divide-y divide-zinc-900">
                              {selectedTeam?.players.map(p => (
                                <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors group">
                                   <td className="p-4 w-12 text-center">
                                      <span className="text-lg font-black italic text-zinc-700">#{p.number}</span>
                                   </td>
                                   <td className="p-4">
                                      <p className="text-xs font-black uppercase text-white truncate">{p.firstName} {p.lastName}</p>
                                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{p.position}</p>
                                   </td>
                                   <td className="p-4 text-right">
                                      <div className="flex justify-end gap-3">
                                         <button onClick={() => setEditingPlayer(p)} className="text-[10px] font-black text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">EDIT</button>
                                         <button onClick={() => startTransition(() => handleDeletePlayer(p.id))} className="text-[10px] font-black text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">VIRER</button>
                                      </div>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Tab Content: MATCHES */}
        {activeTab === "matches" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header>
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Gestion des Matchs</h3>
               <p className="text-sm text-zinc-500 font-medium tracking-tight">Planification, statistiques en direct et validation des résultats.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
               {/* Match Selector & Creation */}
               <div className="lg:col-span-1 space-y-6">
                  {/* Create Match Form */}
                  <form 
                    action={(fd) => startTransition(() => handleCreateMatch(fd))}
                    className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4"
                  >
                     <h4 className="text-sm font-black uppercase tracking-widest text-white">Planifier Match</h4>
                     <div className="space-y-2">
                        <select name="teamAId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none">
                           <option value="">Équipe Domicile</option>
                           {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <p className="text-center text-[10px] font-black text-cyan-500 uppercase">VS</p>
                        <select name="teamBId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none">
                           <option value="">Équipe Extérieur</option>
                           {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                     </div>
                     <input name="date" type="datetime-local" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none" />
                     <button disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95">Créer Match</button>
                  </form>

                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Liste des Matchs</h4>
                     <div className="space-y-2 max-h-[500px] overflow-auto custom-scrollbar pr-2">
                        {matches.map(m => (
                          <div key={m.id} className="relative group">
                            <button 
                              onClick={() => setSelectedMatchId(m.id)}
                              className={cn(
                                "w-full p-4 rounded-xl border text-left transition-all",
                                selectedMatchId === m.id 
                                  ? "bg-cyan-600 border-cyan-500 shadow-lg shadow-cyan-600/20" 
                                  : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
                              )}
                            >
                               <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1", selectedMatchId === m.id ? "text-cyan-100" : "text-zinc-500")}>
                                 {new Date(m.date).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })} • {m.status}
                               </p>
                               <p className={cn("text-xs font-black uppercase tracking-tight", selectedMatchId === m.id ? "text-white" : "text-zinc-300")}>
                                 {m.teamA.name} VS {m.teamB.name}
                               </p>
                            </button>
                            <button 
                              onClick={() => startTransition(() => handleDeleteMatch(m.id))}
                              className="absolute top-2 right-2 text-[10px] font-black text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/80 p-1 rounded hover:text-rose-400"
                            >
                               ✕
                            </button>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Live Controls & Score */}
               <div className="lg:col-span-2 space-y-8">
                  {selectedMatch && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                      {/* Scoreboard Control */}
                      <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                              selectedMatch.status === MatchStatus.LIVE ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                            )}>
                               {selectedMatch.status}
                            </span>
                         </div>

                         <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-6">
                            <div className="text-center flex-1">
                               <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3">{selectedMatch.teamA.name}</p>
                               <span className="text-7xl font-black italic tracking-tighter text-white tabular-nums">{selectedMatch.scoreA}</span>
                            </div>
                            <div className="text-zinc-800 text-4xl font-light">-</div>
                            <div className="text-center flex-1">
                               <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">{selectedMatch.teamB.name}</p>
                               <span className="text-7xl font-black italic tracking-tighter text-white tabular-nums">{selectedMatch.scoreB}</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-900">
                            <button 
                              disabled={selectedMatch.status === MatchStatus.FINI}
                              onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.LIVE))}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-30"
                            >
                               Activer Mode Live
                            </button>
                            <button 
                              disabled={selectedMatch.status === MatchStatus.FINI}
                              onClick={() => startTransition(() => handleUpdateStatus(MatchStatus.PREVU))}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-30"
                            >
                               Pause / Standby
                            </button>
                         </div>
                      </div>

                      {/* Event Logging & Finalization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Actions en Temps Réel</h4>
                            <form 
                              action={(fd) => startTransition(() => handleAddEvent(fd))}
                              className="space-y-4"
                            >
                               <div className="grid grid-cols-2 gap-2">
                                  <select name="type" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                                     {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <input name="minute" type="number" placeholder="Min" defaultValue={selectedMatch.liveMinute} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-black text-white text-center" />
                               </div>
                               <select name="playerId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                                  <option value="">Sélectionner Acteur</option>
                                  {playersForMatch.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                               </select>
                               <button 
                                 disabled={selectedMatch.status !== MatchStatus.LIVE}
                                 className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-30"
                               >
                                  Enregistrer Action
                               </button>
                            </form>
                         </div>

                         <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500/50">Clôture du Match</h4>
                            <form 
                              action={(fd) => startTransition(() => handleFinalize(fd))}
                              className="space-y-4"
                            >
                               <div className="grid grid-cols-2 gap-3">
                                  <div>
                                     <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Score {selectedMatch.teamA.name}</p>
                                     <input name="scoreA" type="number" defaultValue={selectedMatch.scoreA} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-lg font-black text-white text-center" />
                                  </div>
                                  <div>
                                     <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Score {selectedMatch.teamB.name}</p>
                                     <input name="scoreB" type="number" defaultValue={selectedMatch.scoreB} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-lg font-black text-white text-center" />
                                  </div>
                               </div>
                               <button 
                                 disabled={selectedMatch.status === MatchStatus.FINI}
                                 className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-rose-600/20 disabled:opacity-30"
                               >
                                  Valider & Signer Résultat
                               </button>
                            </form>
                         </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Editing Modals */}
      {editingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form action={(fd) => startTransition(() => handleUpdateTeam(fd))} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 p-10 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Éditer Équipe</h2>
                 <button type="button" onClick={() => setEditingTeam(null)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <input name="name" required defaultValue={editingTeam.name} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-4">
                 <input name="coachFirstName" required defaultValue={editingTeam.coachFirstName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
                 <input name="coachLastName" required defaultValue={editingTeam.coachLastName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
              </div>
              <button className="w-full bg-cyan-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest">Enregistrer</button>
           </form>
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form action={(fd) => startTransition(() => handleUpdatePlayer(fd))} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 p-10 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Éditer Joueur</h2>
                 <button type="button" onClick={() => setEditingPlayer(null)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input name="firstName" required defaultValue={editingPlayer.firstName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
                 <input name="lastName" required defaultValue={editingPlayer.lastName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input name="number" type="number" required defaultValue={editingPlayer.number} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" />
                 <select name="position" defaultValue={editingPlayer.position || ""} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-bold uppercase text-white outline-none">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
              <button className="w-full bg-emerald-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest">Enregistrer</button>
           </form>
        </div>
      )}
    </div>
  );
}
