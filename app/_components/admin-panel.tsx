"use client";

import { EventType, MatchStatus, Manager } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Calendar, Cloud, Trash2, Edit3, PlusCircle, CheckCircle2, History, Timer, Trophy, ShieldCheck } from "lucide-react";

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
  poule?: string | null;
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
  title?: string | null;
  teamA: { name: string };
  teamB: { name: string };
  events: MatchEvent[];
};

type Props = {
  teams: Team[];
  matches: Match[];
  managers: Manager[];
};

type TabId = "overview" | "teams" | "matches_crud" | "match_live" | "managers";

export function AdminPanel({ teams, matches, managers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);

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
      poule: (formData.get("poule") as string)?.trim() || "",
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
      poule: (formData.get("poule") as string)?.trim() || "",
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

    // Client-side Duplicate Check
    const isDuplicate = selectedTeam?.players.some(p => {
      const sameName = p.firstName.toLowerCase() === payload.firstName.toLowerCase() && 
                       p.lastName.toLowerCase() === payload.lastName.toLowerCase();
      const sameNumber = Number(p.number) === Number(payload.number);
      return sameName || sameNumber;
    });

    if (isDuplicate) {
      setMessage("Erreur : Un joueur avec ce nom ou ce numéro existe déjà dans cette équipe.");
      return;
    }

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

  async function handleSubstitution(formData: FormData) {
    if (!selectedMatchId) return;
    const payload = {
      type: EventType.SUB,
      playerId: String(formData.get("playerOutId")),
      playerInId: String(formData.get("playerInId")),
      minute: Number(formData.get("minute") ?? 0),
    };
    const response = await fetch(`/api/admin/matches/${selectedMatchId}/substitution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error || "Erreur remplacement");
      return;
    }
    setMessage("Changement effectué");
    router.refresh();
  }

  async function handleTabEvent(type: typeof EventType.TAB_SCORE | typeof EventType.TAB_MISS, playerId: string) {
    if (!selectedMatchId) return;
    const response = await fetch(`/api/admin/matches/${selectedMatchId}/tab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, playerId }),
    });
    if (!response.ok) {
       setMessage("Erreur Tirs au but");
       return;
    }
    setMessage("Tir enregistré");
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
      const result = await response.json();
      setMessage(typeof result.error === "string" ? result.error : "Erreur lors de la création du match. Vérifiez les champs.");
      return;
    }
    setMessage("Match clôturé");
    router.refresh();
  }

  async function handleCreateMatch(formData: FormData) {
    const title = (formData.get("title") as string)?.trim() || "";
    const teamAId = String(formData.get("teamAId") ?? "");
    const teamBId = String(formData.get("teamBId") ?? "");
    const rawDate = String(formData.get("date") ?? "");

    // Validation Poule
    if (title === "Match de poule") {
      const teamA = teams.find(t => t.id === teamAId);
      const teamB = teams.find(t => t.id === teamBId);
      if (teamA?.poule !== teamB?.poule) {
        setMessage("Erreur : Un match de poule doit opposer deux équipes du même groupe.");
        return;
      }
    }

    const isoDate = rawDate ? new Date(rawDate).toISOString() : "";
    
    const payload = {
      title,
      teamAId,
      teamBId,
      date: isoDate,
    };
    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(typeof result.error === "string" ? result.error : "Données de match invalides.");
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

  async function handleCreateManager(formData: FormData) {
    const payload = {
      firstName: (formData.get("firstName") as string)?.trim(),
      password: (formData.get("password") as string)?.trim(),
    };
    const response = await fetch("/api/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur création gestionnaire");
      return;
    }
    setMessage("Gestionnaire créé");
    router.refresh();
  }

  async function handleDeleteManager(id: string) {
    if (!confirm("Supprimer ce gestionnaire ?")) return;
    const response = await fetch(`/api/admin/managers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Erreur suppression");
      return;
    }
    setMessage("Gestionnaire supprimé");
    router.refresh();
  }

  async function handleUpdateManager(formData: FormData) {
    if (!editingManager) return;
    const payload = {
      firstName: (formData.get("firstName") as string)?.trim(),
      password: (formData.get("password") as string)?.trim(),
      assignedMatchIds: formData.getAll("assignedMatchIds")
    };
    const response = await fetch(`/api/admin/managers/${editingManager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur modification");
      return;
    }
    setMessage("Gestionnaire modifié");
    setEditingManager(null);
    router.refresh();
  }

  async function handleUpdateMatch(formData: FormData) {
    if (!editingMatch) return;
    const payload = {
      title: (formData.get("title") as string)?.trim(),
      teamAId: formData.get("teamAId"),
      teamBId: formData.get("teamBId"),
      date: formData.get("date") ? new Date(formData.get("date") as string).toISOString() : editingMatch.date,
    };
    const response = await fetch(`/api/admin/matches/${editingMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Erreur lors de la modification");
      return;
    }
    setMessage("Match modifié");
    setEditingMatch(null);
    router.refresh();
  }

  // Sidebar Component
  const SidebarItem = ({ id, label, icon: Icon }: { id: TabId; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-4 transition-all duration-300 rounded-2xl",
        activeTab === id 
          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      )}
    >
      <Icon size={20} strokeWidth={2.5} />
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
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
        
        <div className="flex-1 px-4 space-y-2 py-6 overflow-y-auto">
          {[
            { id: "overview", label: "Tableau de Bord", icon: LayoutDashboard },
            { id: "teams", label: "Clubs & Joueurs", icon: Users },
            { id: "matches_crud", label: "Calendrier", icon: Calendar },
            { id: "match_live", label: "Direct (Live)", icon: Timer },
            { id: "managers", label: "Gestionnaires", icon: ShieldCheck },
          ].map((tab) => (
            <SidebarItem key={tab.id} id={tab.id as TabId} label={tab.label} icon={tab.icon} />
          ))}
        </div>

        <div className="mt-auto p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
           <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Statut Système</p>
           <div className="flex items-center gap-2">
             <Cloud className="h-4 w-4 text-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest leading-none">Cloud Sync Live</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto custom-scrollbar relative">
        {/* Banner/Notification Area */}
        {message && (
          <div className="fixed top-8 right-8 z-[110] rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">{message}</p>
            <button onClick={() => setMessage("")} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>
        )}

        {/* Tab Content: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header>
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Tableau de Bord</h3>
               <p className="text-sm text-zinc-500 font-medium tracking-tight">Vue d'overview et statistiques rapides du tournoi.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Clubs Engagés</p>
                    <Trophy size={16} className="text-cyan-500" />
                  </div>
                  <p className="text-4xl font-black text-white">{teams.length}</p>
               </div>
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Matchs Joués</p>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-4xl font-black text-white">{matches.filter(m => m.status === MatchStatus.FINI).length}</p>
               </div>
               <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Total Joueurs</p>
                    <Users size={16} className="text-amber-500" />
                  </div>
                  <p className="text-4xl font-black text-white">{teams.reduce((acc, t) => acc + t.players.length, 0)}</p>
               </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
               <div className="flex items-center gap-3 mb-6">
                 <History size={20} className="text-cyan-500" />
                 <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">Dernières Activités</h4>
               </div>
               <div className="space-y-4">
                  {matches.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 hover:border-zinc-700 transition-colors">
                       <span className="text-xs font-black uppercase text-zinc-300">
                         {m.teamA?.name || "Inconnu"} <b className="text-cyan-500 mx-2">VS</b> {m.teamB?.name || "Inconnu"}
                       </span>
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
                     <div className="flex items-center gap-2 mb-2">
                       <PlusCircle size={16} className="text-cyan-500" />
                       <h4 className="text-sm font-black uppercase tracking-widest text-white">Nouveau Club</h4>
                     </div>
                     <input name="name" required placeholder="Nom de l'équipe" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                     <div className="grid grid-cols-2 gap-2">
                        <select name="poule" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                           <option value="">Sélectionner Poule</option>
                           <option value="Poule A">Poule A</option>
                           <option value="Poule B">Poule B</option>
                           <option value="Poule C">Poule C</option>
                           <option value="Poule D">Poule D</option>
                        </select>
                        <input name="colors" placeholder="Couleurs (ex: Rouge/Blanc)" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none" />
                     </div>
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
                              <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Poule</th>
                              <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                           {teams.map(t => (
                             <tr key={t.id} className={cn("hover:bg-zinc-900/30 transition-colors group", selectedTeamId === t.id && "bg-cyan-500/5 shadow-inner")}>
                                <td className="p-4 cursor-pointer" onClick={() => setSelectedTeamId(t.id)}>
                                   <p className="text-xs font-black uppercase text-white truncate">{t.name}</p>
                                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{t.coachFirstName} {t.coachLastName}</p>
                                </td>
                                <td className="p-4">
                                   <span className={cn(
                                     "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                                     t.poule ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-zinc-900 text-zinc-600 border-zinc-800"
                                   )}>
                                     {t.poule || "N/A"}
                                   </span>
                                </td>
                                <td className="p-4 text-right">
                                   <div className="flex justify-end gap-3">
                                      <button onClick={() => setEditingTeam(t)} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size={14} />
                                      </button>
                                      <button onClick={() => startTransition(() => handleDeleteTeam(t.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                      </button>
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
                  <header className="flex items-center justify-between p-1">
                     <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Gestion Effectif</h4>
                     <div className="h-px flex-1 mx-4 bg-zinc-900" />
                     <span className="text-[10px] font-black text-cyan-500 uppercase">{selectedTeam?.name}</span>
                  </header>

                  <form 
                    action={(fd) => startTransition(() => handleCreatePlayer(fd))}
                    className="p-6 rounded-2xl bg-zinc-800/20 border border-zinc-800 space-y-4"
                  >
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
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Effectif Actuel</h4>
                        <span className="text-[10px] font-black text-cyan-500 leading-none">{selectedTeam?.players.length || 0} JOUEURS</span>
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
                                         <button onClick={() => setEditingPlayer(p)} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Edit3 size={14} />
                                         </button>
                                         <button onClick={() => startTransition(() => handleDeletePlayer(p.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Trash2 size={14} />
                                         </button>
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

        {/* Matches CRUD Tab (Planning) */}
        {activeTab === "matches_crud" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Calendrier & Planning</h3>
                   <p className="text-sm text-zinc-500 font-medium tracking-tight">Planifiez les rencontres et gérez la liste des matchs.</p>
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                   <form 
                     action={(fd) => startTransition(() => handleCreateMatch(fd))}
                     className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6"
                   >
                      <div className="flex items-center gap-2 mb-2">
                        <PlusCircle size={16} className="text-cyan-500" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Planifier Match</h4>
                      </div>
                      
                      <select name="title" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none focus:border-cyan-500">
                         <option value="">Sélectionnez le type de match</option>
                         <option value="Match de poule">Match de poule</option>
                         <option value="Demi-finale">Demi-finale</option>
                         <option value="Finale">Finale</option>
                         <option value="Match Amical">Match Amical</option>
                      </select>

                      <div className="space-y-4">
                         <select name="teamAId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none">
                            <option value="">Équipe Domicile</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                         <select name="teamBId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none">
                            <option value="">Équipe Extérieur</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                         <input name="date" type="datetime-local" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm text-white outline-none" />
                      </div>

                      <button disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95">Valider Rencontre</button>
                   </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                      <table className="w-full text-left">
                         <thead className="bg-zinc-900/50 border-b border-zinc-800">
                            <tr>
                               <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Affiche</th>
                               <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Type</th>
                               <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Statut</th>
                               <th className="p-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-900">
                            {matches.map(m => (
                              <tr key={m.id} className="hover:bg-zinc-900/30 transition-colors group">
                                 <td className="p-4">
                                    <p className="text-xs font-black uppercase text-white truncate">{m.teamA?.name} vs {m.teamB?.name}</p>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{new Date(m.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                 </td>
                                 <td className="p-4">
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-zinc-900 text-zinc-400 border-zinc-800">
                                       {m.title || "Match"}
                                    </span>
                                 </td>
                                 <td className="p-4">
                                    <span className={cn(
                                       "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                                       m.status === MatchStatus.LIVE ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                    )}>
                                       {m.status}
                                    </span>
                                 </td>
                                 <td className="p-4 text-right">
                                    <div className="flex justify-end gap-3">
                                       <button onClick={() => setEditingMatch(m)} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Edit3 size={14} />
                                       </button>
                                       <button onClick={() => startTransition(() => handleDeleteMatch(m.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={14} />
                                       </button>
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
        )}

        {/* Live Control Tab */}
        {activeTab === "match_live" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Direct / Contrôle</h3>
                   <p className="text-sm text-zinc-500 font-medium tracking-tight">Gérez les scores et les évènements de match en temps réel.</p>
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Match Selector */}
                <div className="lg:col-span-1 space-y-6">
                   <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Matchs Actifs / Prochains</h4>
                      <div className="space-y-2 max-h-[600px] overflow-auto custom-scrollbar pr-2">
                         {matches.filter(m => m.status !== MatchStatus.FINI).map(m => (
                           <button 
                             key={m.id}
                             onClick={() => setSelectedMatchId(m.id)}
                             className={cn(
                               "w-full p-4 rounded-xl border text-left transition-all",
                               selectedMatchId === m.id 
                                 ? "bg-cyan-600 border-cyan-500 shadow-lg shadow-cyan-600/20" 
                                 : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
                             )}
                           >
                              <div className="flex justify-between items-start mb-1">
                                <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", selectedMatchId === m.id ? "text-cyan-100" : "text-zinc-500")}>
                                  {m.status} • {new Date(m.date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className={cn("text-xs font-black uppercase tracking-tight", selectedMatchId === m.id ? "text-white" : "text-zinc-300")}>
                                {m.teamA?.name} VS {m.teamB?.name}
                              </p>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Scoreboard & Controls */}
                <div className="lg:col-span-2 space-y-8">
                   {selectedMatch ? (
                     <div className="space-y-8">
                        <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden text-center">
                           <div className="absolute top-0 right-0 p-4">
                              <select 
                                value={selectedMatch.status}
                                onChange={(e) => startTransition(() => handleUpdateStatus(e.target.value as MatchStatus))}
                                className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase px-3 py-1 rounded-full outline-none text-cyan-500"
                              >
                                 {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>

                           <div className="flex items-center justify-center gap-10 py-6">
                              <div className="text-center flex-1">
                                 <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3">{selectedMatch.teamA?.name}</p>
                                 <span className="text-7xl font-black italic tracking-tighter text-white tabular-nums">{selectedMatch.scoreA}</span>
                              </div>
                              <div className="text-zinc-800 text-4xl font-light">VS</div>
                              <div className="text-center flex-1">
                                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">{selectedMatch.teamB?.name}</p>
                                 <span className="text-7xl font-black italic tracking-tighter text-white tabular-nums">{selectedMatch.scoreB}</span>
                              </div>
                           </div>
                        </div>

                        {/* Events Logging */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ajouter Évènement</h4>
                              <form action={(fd) => startTransition(() => handleAddEvent(fd))} className="space-y-4">
                                 <div className="grid grid-cols-2 gap-2">
                                    <select name="type" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                                       {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <input name="minute" type="number" placeholder="Min" defaultValue={selectedMatch.liveMinute} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-black text-white" />
                                 </div>
                                 <select name="playerId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                                    <option value="">Sélectionner Joueur</option>
                                    {playersForMatch.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                                 </select>
                                 <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Enregistrer Action</button>
                              </form>

                               {/* Substitution Quick Form */}
                               <div className="pt-4 border-t border-zinc-800">
                                  <h5 className="text-[9px] font-black uppercase text-zinc-600 mb-3">Remplacement Rapide</h5>
                                  <form action={(fd) => startTransition(() => handleSubstitution(fd))} className="space-y-3">
                                     <div className="grid grid-cols-2 gap-2">
                                        <select name="playerOutId" required className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-[9px] font-bold uppercase text-rose-400 outline-none">
                                           <option value="">Sortie</option>
                                           {playersForMatch.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                                        </select>
                                        <select name="playerInId" required className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-[9px] font-bold uppercase text-emerald-400 outline-none">
                                           <option value="">Entrée</option>
                                           {playersForMatch.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                                        </select>
                                     </div>
                                     <input name="minute" type="number" placeholder="Min" defaultValue={selectedMatch.liveMinute} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-[9px] font-black text-white" />
                                     <button className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-300 transition-all">Valider Changement</button>
                                  </form>
                               </div>
                            </div>

                           <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 h-[300px] overflow-auto custom-scrollbar">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Flux d'évènements</h4>
                              <div className="space-y-3">
                                 {selectedMatch.events.map(e => (
                                   <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 group transition-all">
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-cyan-500">{e.minute}'</span>
                                         <div>
                                            <p className="text-[10px] font-black uppercase text-white leading-none">{e.type}</p>
                                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{e.player.lastName}</p>
                                         </div>
                                      </div>
                                      <button onClick={() => startTransition(() => handleDeleteEvent(e.id))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/10 rounded">
                                        <Trash2 size={12} />
                                      </button>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Finalization */}
                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col items-center gap-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500/50 text-center">Clôture du Match</h4>
                           <form action={(fd) => startTransition(() => handleFinalize(fd))} className="flex gap-4 items-center">
                              <input name="scoreA" type="number" defaultValue={selectedMatch.scoreA} className="w-16 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-center font-black" />
                              <span className="text-zinc-600">-</span>
                              <input name="scoreB" type="number" defaultValue={selectedMatch.scoreB} className="w-16 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-center font-black" />
                              <button className="bg-rose-600 hover:bg-rose-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Finaliser</button>
                           </form>
                        </div>

                         {/* Penalty Shoot-out Section (List View) */}
                         {selectedMatch.status === MatchStatus.TAB && (
                           <div className="p-8 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 space-y-8">
                              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Séance de Tirs au But</h4>
                                 <div className="flex items-center gap-4 text-white">
                                    <div className="text-center">
                                       <span className="text-xl font-black tabular-nums">
                                          {selectedMatch.events?.filter(e => e.type === EventType.TAB_SCORE && teams.find(t => t.id === selectedMatch.teamAId)?.players.some(p => p.id === e.player.id)).length}
                                       </span>
                                       <p className="text-[8px] font-black text-zinc-500 uppercase">Team A</p>
                                    </div>
                                    <span className="text-zinc-700">-</span>
                                    <div className="text-center">
                                       <span className="text-xl font-black tabular-nums">
                                          {selectedMatch.events?.filter(e => e.type === EventType.TAB_SCORE && teams.find(t => t.id === selectedMatch.teamBId)?.players.some(p => p.id === e.player.id)).length}
                                       </span>
                                       <p className="text-[8px] font-black text-zinc-500 uppercase">Team B</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                 {[
                                   { team: selectedMatch.teamA, players: teams.find(t => t.id === selectedMatch.teamAId)?.players || [] },
                                   { team: selectedMatch.teamB, players: teams.find(t => t.id === selectedMatch.teamBId)?.players || [] }
                                 ].map((group, idx) => (
                                   <div key={idx} className="space-y-4">
                                      <p className="text-[10px] font-black uppercase text-zinc-400 pl-2 border-l border-cyan-500">{group.team.name}</p>
                                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                         {group.players.map(p => {
                                            const shot = selectedMatch.events?.find(e => e.player.id === p.id && (e.type === EventType.TAB_SCORE || e.type === EventType.TAB_MISS));
                                            return (
                                              <div key={p.id} className={cn(
                                                "p-3 rounded-xl flex items-center justify-between border transition-all",
                                                shot?.type === EventType.TAB_SCORE ? "bg-emerald-500/5 border-emerald-500/20" : 
                                                shot?.type === EventType.TAB_MISS ? "bg-rose-500/5 border-rose-500/20" : 
                                                "bg-zinc-950/50 border-zinc-800"
                                              )}>
                                                 <span className="text-[10px] font-bold text-zinc-300 uppercase">#{p.number} {p.lastName}</span>
                                                 <div className="flex gap-1">
                                                    {!shot ? (
                                                      <>
                                                         <button onClick={() => startTransition(() => handleTabEvent(EventType.TAB_SCORE, p.id))} className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-500 text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">OK</button>
                                                         <button onClick={() => startTransition(() => handleTabEvent(EventType.TAB_MISS, p.id))} className="px-2 py-1 rounded bg-rose-600/20 text-rose-500 text-[8px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">X</button>
                                                      </>
                                                    ) : (
                                                      <div className="flex items-center gap-2">
                                                         <span className={cn("text-[8px] font-black uppercase", shot.type === EventType.TAB_SCORE ? "text-emerald-500" : "text-rose-500")}>
                                                            {shot.type === EventType.TAB_SCORE ? "Gagné" : "Raté"}
                                                         </span>
                                                         <button onClick={() => startTransition(() => handleDeleteEvent(shot.id))} className="text-zinc-700 hover:text-white"><Trash2 size={10} /></button>
                                                      </div>
                                                    )}
                                                 </div>
                                              </div>
                                            );
                                         })}
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center p-20 text-center grayscale opacity-20">
                        <Timer size={60} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Sélectionnez un match pour contrôler le direct</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* Tab Content: MANAGERS */}
        {activeTab === "managers" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header className="flex justify-between items-end">
               <div>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Gestionnaires</h3>
                  <p className="text-sm text-zinc-500 font-medium tracking-tight">Gérez les comptes d'accès pour les reporters du tournoi.</p>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1">
                  <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-6">
                     <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                        <PlusCircle size={20} className="text-cyan-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Nouveau Gestionnaire</h4>
                     </div>
                     <form action={handleCreateManager} className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">Prénom</label>
                           <input name="firstName" required className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none focus:border-cyan-500 transition-all font-bold" placeholder="Ex: Jean" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">Mot de Passe</label>
                           <input name="password" type="password" required className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none focus:border-cyan-500 transition-all font-bold" placeholder="••••••••" />
                        </div>
                        <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-600/20 active:scale-95 transition-all">
                           Créer le compte
                        </button>
                     </form>
                  </div>
               </div>

               <div className="lg:col-span-2">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 overflow-hidden shadow-2xl">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-zinc-800 bg-zinc-900/50">
                              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Prénom</th>
                              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Match Assigné</th>
                              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                           {managers.map(m => {
                             return (
                               <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="p-6">
                                     <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                           <Users size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-white">{m.firstName}</span>
                                     </div>
                                  </td>
                                  <td className="p-6">
                                     <div className="flex flex-wrap gap-2">
                                       {m.assignedMatchIds && m.assignedMatchIds.length > 0 ? (
                                         m.assignedMatchIds.map(mid => {
                                            const match = matches.find(mm => mm.id === mid);
                                            if (!match) return null;
                                            return (
                                              <span key={mid} className="text-[10px] font-black uppercase px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20 whitespace-nowrap">
                                                 {match.teamA?.name} vs {match.teamB?.name}
                                              </span>
                                            );
                                         })
                                       ) : (
                                         <span className="text-[10px] font-black uppercase text-zinc-600">Aucun</span>
                                       )}
                                     </div>
                                  </td>
                                  <td className="p-6 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => setEditingManager(m)} className="p-2 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                           <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => startTransition(() => handleDeleteManager(m.id))} className="p-2 rounded-lg bg-zinc-900 text-rose-500 hover:bg-rose-500/10 transition-all">
                                           <Trash2 size={14} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             );
                           })}
                        </tbody>
                     </table>
                     {managers.length === 0 && (
                        <div className="p-20 text-center">
                           <p className="text-sm font-black uppercase tracking-widest text-zinc-700">Aucun gestionnaire enregistré</p>
                        </div>
                     )}
                  </div>
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
              <input name="name" required defaultValue={editingTeam.name} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500" />
              <div className="grid grid-cols-2 gap-4">
                 <select name="poule" defaultValue={editingTeam.poule || ""} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-cyan-500">
                    <option value="">Sélectionner Poule</option>
                    <option value="Poule A">Poule A</option>
                    <option value="Poule B">Poule B</option>
                    <option value="Poule C">Poule C</option>
                    <option value="Poule D">Poule D</option>
                 </select>
                 <input name="colors" defaultValue={editingTeam.colors || ""} placeholder="Couleurs" className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input name="coachFirstName" required defaultValue={editingTeam.coachFirstName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500" />
                 <input name="coachLastName" required defaultValue={editingTeam.coachLastName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500" />
              </div>
              <button className="w-full bg-cyan-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95">Enregistrer</button>
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
                 <input name="firstName" required defaultValue={editingPlayer.firstName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm focus:border-emerald-500 outline-none" />
                 <input name="lastName" required defaultValue={editingPlayer.lastName} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm focus:border-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input name="number" type="number" required defaultValue={editingPlayer.number} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm focus:border-emerald-500 outline-none" />
                 <select name="position" defaultValue={editingPlayer.position || ""} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-bold uppercase text-white outline-none focus:border-emerald-500">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
               <button className="w-full bg-emerald-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95">Enregistrer</button>
           </form>
        </div>
      )}

      {editingMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form action={(fd) => startTransition(() => handleUpdateMatch(fd))} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 p-10 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Éditer Match</h2>
                 <button type="button" onClick={() => setEditingMatch(null)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <select name="title" defaultValue={editingMatch.title || ""} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-bold uppercase text-white outline-none focus:border-cyan-500">
                 <option value="Match de poule">Match de poule</option>
                 <option value="Demi-finale">Demi-finale</option>
                 <option value="Finale">Finale</option>
                 <option value="Match Amical">Match Amical</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                 <select name="teamAId" defaultValue={editingMatch.teamAId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
                 <select name="teamBId" defaultValue={editingMatch.teamBId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
              </div>
              <input name="date" type="datetime-local" defaultValue={new Date(editingMatch.date).toISOString().slice(0, 16)} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none" />
              <button className="w-full bg-cyan-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95">Enregistrer</button>
           </form>
        </div>
      )}

      {editingManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form action={(fd) => startTransition(() => handleUpdateManager(fd))} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 p-10 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Éditer Gestionnaire</h2>
                 <button type="button" onClick={() => setEditingManager(null)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">Prénom</label>
                    <input name="firstName" required defaultValue={editingManager.firstName} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none focus:border-cyan-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">Nouveau Mot de Passe (laisser vide pour inchangé)</label>
                    <input name="password" type="password" className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none focus:border-cyan-500" placeholder="••••••••" />
                 </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">Assigner des Matchs</label>
                   <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                      {matches.map(m => (
                        <label key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors border border-transparent hover:border-zinc-800">
                           <input 
                              type="checkbox" 
                              name="assignedMatchIds" 
                              value={m.id} 
                              defaultChecked={editingManager.assignedMatchIds?.includes(m.id)}
                              className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-900"
                           />
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-white uppercase">{m.teamA?.name} vs {m.teamB?.name}</span>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase">{new Date(m.date).toLocaleDateString()} - {m.title}</span>
                           </div>
                        </label>
                      ))}
                      {matches.length === 0 && (
                        <p className="text-[10px] text-zinc-600 uppercase font-black text-center py-4">Aucun match disponible</p>
                      )}
                   </div>
                </div>
              </div>
              <button className="w-full bg-cyan-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                 Enregistrer les modifications
              </button>
           </form>
        </div>
      )}
    </div>
  );
}
