"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Timer, 
  Trophy, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  PlusCircle,
  ArrowRight
} from "lucide-react";
import { EventType, MatchStatus } from "@/lib/types";

type Props = {
  match: any;
  players: any[];
  managerName: string;
  showBackButton?: boolean;
};

export function ManagerControlRoom({ match, players, managerName, showBackButton }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    const res = await fetch("/api/manager/logout", { method: "POST" });
    if (res.ok) router.push("/manager/login");
  };

  async function handleUpdateStatus(status: MatchStatus) {
    const res = await fetch(`/api/admin/matches/${match.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMessage("Statut mis à jour");
      router.refresh();
    }
  }

  async function handleAddEvent(formData: FormData) {
    const type = formData.get("type") as string;
    const playerId = formData.get("playerId") as string;
    const minute = Number(formData.get("minute"));

    const res = await fetch(`/api/admin/matches/${match.id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, playerId, minute }),
    });
    if (res.ok) {
      setMessage("Action enregistrée");
      router.refresh();
    }
  }

  async function handleSubstitution(formData: FormData) {
    const payload = {
      playerOutId: formData.get("playerOutId"),
      playerInId: formData.get("playerInId"),
      minute: Number(formData.get("minute") || 0),
    };
    const res = await fetch(`/api/admin/matches/${match.id}/substitution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("Changement effectué");
      router.refresh();
    }
  }

  async function handleTabEvent(type: string, playerId: string) {
    const res = await fetch(`/api/admin/matches/${match.id}/tab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, playerId }),
    });
    if (res.ok) {
      setMessage("Tir enregistré");
      router.refresh();
    }
  }

  async function handleFinalize(formData: FormData) {
    const payload = {
      scoreA: Number(formData.get("scoreA")),
      scoreB: Number(formData.get("scoreB")),
    };
    const res = await fetch(`/api/admin/matches/${match.id}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/manager/login");
  }

  const getTabScore = (teamId: string) => {
    return match.events?.filter((e: any) => 
      e.type === EventType.TAB_SCORE && 
      players.find(p => p.id === e.playerId)?.teamId === teamId
    ).length || 0;
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10 md:px-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
           <div className="flex items-center gap-4">
              {showBackButton && (
                <button 
                  onClick={() => router.push("/manager/dashboard")}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all mr-2"
                  title="Retour à la liste des matchs"
                >
                   <ArrowRight size={20} className="rotate-180" />
                </button>
              )}
              <div className="h-12 w-12 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-1">Régie Direct</p>
                 <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                    {match.teamA?.name} <span className="text-zinc-700 mx-2">VS</span> {match.teamB?.name}
                 </h1>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Opérateur : {managerName}</p>
              </div>
           </div>
           
           <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all">
              <LogOut size={16} />
              Déconnexion
           </button>
        </header>

        {message && (
          <div className="fixed top-10 right-10 z-50 bg-cyan-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in fade-in slide-in-from-top-4">
             {message}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Column 1: Match Info & Status */}
           <div className="space-y-8 lg:col-span-2">
              <div className="p-10 rounded-[40px] bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6">
                    <select 
                      value={match.status}
                      onChange={(e) => startTransition(() => handleUpdateStatus(e.target.value as MatchStatus))}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase px-4 py-2 rounded-full outline-none text-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
                    >
                       {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>

                 <div className="flex items-center justify-center gap-12 py-10">
                    <div className="text-center flex-1">
                       <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-4">{match.teamA?.name}</p>
                       <div className="flex flex-col items-center">
                          <span className="text-8xl font-black italic tracking-tighter text-white tabular-nums">{match.scoreA}</span>
                          {match.status === MatchStatus.TAB && (
                             <span className="text-xl font-black text-cyan-500 mt-2">
                                ({getTabScore(match.teamAId)} TAB)
                             </span>
                          )}
                       </div>
                    </div>
                    <div className="h-20 w-px bg-zinc-900" />
                    <div className="text-center flex-1">
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">{match.teamB?.name}</p>
                       <div className="flex flex-col items-center">
                          <span className="text-8xl font-black italic tracking-tighter text-white tabular-nums">{match.scoreB}</span>
                          {match.status === MatchStatus.TAB && (
                             <span className="text-xl font-black text-rose-500 mt-2">
                                ({getTabScore(match.teamBId)} TAB)
                             </span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Advanced Controls (TAB & Subs) */}
              <div className="space-y-8">
                 {/* Penalty Shootout (Detailed List View) */}
                 {match.status === MatchStatus.TAB && (
                   <div className="p-10 rounded-[40px] bg-cyan-600/5 border border-cyan-500/20 space-y-10">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-6">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">Séance de Tirs au But</h4>
                         <div className="flex items-center gap-6">
                            <div className="text-center">
                               <span className="text-2xl font-bold text-white tabular-nums">{getTabScore(match.teamAId)}</span>
                               <p className="text-[8px] font-black text-zinc-600 uppercase">Team A</p>
                            </div>
                            <span className="text-zinc-800 text-xl font-light">-</span>
                            <div className="text-center">
                               <span className="text-2xl font-bold text-white tabular-nums">{getTabScore(match.teamBId)}</span>
                               <p className="text-[8px] font-black text-zinc-600 uppercase">Team B</p>
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-center mb-6">
                         <button 
                            onClick={() => alert("Séance terminée. Vous pouvez maintenant clôturer le match avec le score final.")}
                            className="px-8 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-500 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all active:scale-95"
                         >Marquer la séance comme finie</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         {[
                           { team: match.teamA, teamId: match.teamAId },
                           { team: match.teamB, teamId: match.teamBId }
                         ].map((group, idx) => (
                           <div key={idx} className="space-y-6">
                              <p className="text-[10px] font-black uppercase text-zinc-400 border-l-2 border-cyan-500 pl-3">{group.team?.name}</p>
                              <div className="space-y-3 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                                 {players.filter(p => p.teamId === group.teamId).map(p => {
                                    const shot = match.events?.find((e: any) => e.playerId === p.id && (e.type === EventType.TAB_SCORE || e.type === EventType.TAB_MISS));
                                    return (
                                      <div key={p.id} className={cn(
                                        "p-4 rounded-2xl flex items-center justify-between transition-all border",
                                        shot?.type === EventType.TAB_SCORE ? "bg-emerald-500/10 border-emerald-500/20" : 
                                        shot?.type === EventType.TAB_MISS ? "bg-rose-500/10 border-rose-500/20" : 
                                        "bg-zinc-900 border-zinc-800"
                                      )}>
                                         <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-600 w-4">#{p.number}</span>
                                            <span className="text-[10px] font-bold text-white uppercase">{p.lastName}</span>
                                         </div>
                                         <div className="flex gap-2">
                                            {!shot ? (
                                              <>
                                                 <button onClick={() => startTransition(() => handleTabEvent(EventType.TAB_SCORE, p.id))} className="h-8 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all">Gagné</button>
                                                 <button onClick={() => startTransition(() => handleTabEvent(EventType.TAB_MISS, p.id))} className="h-8 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:text-rose-500 hover:border-rose-500/50 transition-all">Raté</button>
                                              </>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                 <span className={cn("text-[9px] font-black uppercase tracking-widest", shot.type === EventType.TAB_SCORE ? "text-emerald-500" : "text-rose-500")}>
                                                    {shot.type === EventType.TAB_SCORE ? "Marqué" : "Raté"}
                                                 </span>
                                                 <button onClick={() => {
                                                   if(confirm("Supprimer ce tir ?")) {
                                                      const eventId = match.events.find((e:any) => e.playerId === p.id && (e.type === EventType.TAB_SCORE || e.type === EventType.TAB_MISS))?.id;
                                                      if(eventId) fetch(`/api/admin/matches/${match.id}/event/${eventId}`, { method: 'DELETE' }).then(() => router.refresh());
                                                   }
                                                 }} className="text-zinc-700 hover:text-white transition-colors"><Trash2 size={12} /></button>
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

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Substitution */}
                    <div className="p-8 rounded-[32px] bg-zinc-900/40 border border-zinc-900 space-y-6">
                       <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                          <PlusCircle size={20} className="text-emerald-500" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Remplacement</h4>
                       </div>
                       <form action={(fd) => startTransition(() => handleSubstitution(fd))} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <select name="playerOutId" required className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-rose-400 outline-none">
                                <option value="">Sortie</option>
                                {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                             </select>
                             <select name="playerInId" required className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-emerald-400 outline-none">
                                <option value="">Entrée</option>
                                {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                             </select>
                          </div>
                          <input name="minute" type="number" placeholder="Minute" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-black text-white" defaultValue={match.liveMinute} />
                          <button className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95">Valider le changement</button>
                       </form>
                    </div>

                    {/* Action Logging */}
                    <div className="p-8 rounded-[32px] bg-zinc-900/40 border border-zinc-900 space-y-6">
                       <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                          <PlusCircle size={20} className="text-cyan-500" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Nouvelle Action</h4>
                       </div>
                       <form action={(fd) => startTransition(() => handleAddEvent(fd))} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <select name="type" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                                {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                             <input name="minute" type="number" placeholder="Minute" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-black text-white" defaultValue={match.liveMinute} />
                          </div>
                          <select name="playerId" required className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase text-white outline-none">
                             <option value="">Sélectionner Joueur</option>
                             {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.lastName}</option>)}
                          </select>
                          <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-cyan-600/20 active:scale-95">Enregistrer</button>
                       </form>
                    </div>
                 </div>
              </div>
           </div>

           {/* Column 2: Event Feed & Finalize */}
           <div className="space-y-8">
              <div className="p-8 rounded-[32px] bg-zinc-950 border border-zinc-900 flex flex-col h-[500px]">
                 <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-3">
                       <Timer size={18} className="text-zinc-500" />
                       <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Flux Live</h4>
                    </div>
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                 </div>
                 
                 <div className="flex-1 overflow-auto space-y-4 custom-scrollbar pr-2">
                    {match.events?.map((e: any) => (
                      <div key={e.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-cyan-500 w-8">{e.minute}'</span>
                            <div>
                               <p className="text-[10px] font-black uppercase text-white">{e.type}</p>
                               <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{e.player?.lastName || "Inconnu"}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                    {(!match.events || match.events.length === 0) && (
                      <div className="text-center py-20 grayscale opacity-20 italic">
                         <p className="text-xs font-black uppercase tracking-widest">Aucun événement</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-8 rounded-[32px] bg-rose-500/5 border border-rose-500/20 space-y-6">
                 <div className="flex items-center gap-3 justify-center mb-2">
                    <CheckCircle2 size={16} className="text-rose-500" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-500">Clôture Finale</h4>
                 </div>
                 <form action={(fd) => startTransition(() => handleFinalize(fd))} className="space-y-4">
                    <div className="flex justify-center items-center gap-6">
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">TEAM A</p>
                          <input name="scoreA" type="number" defaultValue={match.scoreA} className="w-20 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center font-black text-xl" />
                       </div>
                       <span className="text-zinc-800 pt-4">-</span>
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">TEAM B</p>
                          <input name="scoreB" type="number" defaultValue={match.scoreB} className="w-20 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center font-black text-xl" />
                       </div>
                    </div>
                    <button className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg active:scale-95 transition-all">
                       Finaliser & Fermer
                    </button>
                    <p className="text-[8px] text-zinc-600 text-center uppercase font-bold tracking-widest">Cette action déconnectera la régie</p>
                 </form>
              </div>
           </div>

        </div>
      </div>
    </main>
  );
}
