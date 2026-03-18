import { getTeamById } from "@/lib/tournament";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 md:px-10 font-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center gap-8 rounded-[2.5rem] border border-zinc-800 bg-zinc-900/50 p-10 shadow-2xl shadow-cyan-500/5 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/5 blur-[120px] rounded-full -mr-32 -mt-32" />
          
          <div className="relative z-10 shrink-0">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="h-24 w-24 rounded-3xl object-cover border-2 border-zinc-800 shadow-2xl shadow-black/50 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="h-24 w-24 rounded-3xl bg-zinc-800 flex items-center justify-center text-zinc-500 text-5xl font-black border-2 border-zinc-700 shadow-2xl">
                {team.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="text-center md:text-left relative z-10 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-2 block">Profil de l'Équipe</span>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              {team.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-zinc-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-700/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Entraîneur</p>
                <p className="text-sm font-bold text-white uppercase">{team.coachFirstName} {team.coachLastName}</p>
              </div>
              {team.colors && (
                <div className="bg-zinc-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-700/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Couleurs</p>
                  <p className="text-sm font-bold text-zinc-300 uppercase italic opacity-80">{team.colors}</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:self-start">
             <a href="/" className="group px-6 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all shadow-xl active:scale-95 uppercase tracking-widest">
               <span className="inline-block transition-transform group-hover:-translate-x-1 mr-2">←</span>
               Accueil
             </a>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Roster Section */}
          <section className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
               <h2 className="text-base font-semibold uppercase text-white">Effectif Officiel</h2>
               <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-medium">
                 {team.players.length} Joueurs
               </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {team.players.map((player) => (
                <div key={player.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:bg-zinc-900 hover:border-cyan-500/30 group">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-950 shrink-0 shadow group-hover:border-cyan-500/20 transition-all">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700 font-bold text-2xl">
                        {player.number}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold text-cyan-500">#{player.number}</span>
                      <h3 className="text-sm font-semibold text-white uppercase truncate">
                        {player.firstName} {player.lastName}
                      </h3>
                    </div>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase mb-2">{player.position || "Non défini"}</p>
                    
                    {player.stats && (
                      <div className="flex gap-3 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                        <div className="text-center flex-1">
                          <p className="text-[9px] font-medium text-zinc-500 uppercase mb-0.5">Buts</p>
                          <p className="text-xs font-semibold text-emerald-400">⚽ {player.stats.goals}</p>
                        </div>
                        <div className="text-center flex-1 border-x border-zinc-800/50 px-2">
                          <p className="text-[9px] font-medium text-zinc-500 uppercase mb-0.5">Assists</p>
                          <p className="text-xs font-semibold text-cyan-400">🎯 {player.stats.assists}</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-[9px] font-medium text-zinc-500 uppercase mb-0.5">Cartons</p>
                          <div className="flex justify-center gap-1.5 text-[10px] items-center h-4">
                            <span className="w-2 h-3 bg-amber-400 rounded-sm shadow-sm" /> 
                            <span className="font-medium">{player.stats.yellowCards}</span>
                            <span className="w-2 h-3 bg-rose-500 rounded-sm shadow-sm ml-1" />
                            <span className="font-medium">{player.stats.redCards}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Results Section */}
          <section className="space-y-8">
            <h2 className="text-base font-semibold uppercase text-white border-b border-zinc-800 pb-3">Historique</h2>
            <div className="space-y-4">
              {team.lastMatches.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
                   <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Aucun match disponible</p>
                </div>
              ) : (
                team.lastMatches.map((match: any) => {
                   const isWin = (match.teamAId === id && match.scoreA > match.scoreB) || (match.teamBId === id && match.scoreB > match.scoreA);
                   const isLoss = (match.teamAId === id && match.scoreA < match.scoreB) || (match.teamBId === id && match.scoreB < match.scoreA);

                  return (
                    <div key={match.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 hover:bg-zinc-900 transition-all border-l-8 border-l-zinc-800 group overflow-hidden relative">
                      {isWin && <div className="absolute top-0 right-0 p-2"><span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">WIN</span></div>}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                          {format(match.date, "dd MMMM yyyy", { locale: fr })}
                        </span>
                        <div className={`h-2.5 w-2.5 rounded-full ${isWin ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : isLoss ? "bg-rose-500 shadow-lg shadow-rose-500/50" : "bg-zinc-600"}`} />
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className={`flex-1 text-center font-black text-sm uppercase truncate ${match.teamAId === id ? "text-cyan-400" : "text-zinc-500"}`}>{match.teamA.name}</span>
                        <div className="bg-zinc-950 px-5 py-2 rounded-2xl border-2 border-zinc-800 flex items-center gap-3">
                           <span className="text-2xl font-black tabular-nums">{match.scoreA}</span>
                           <span className="text-zinc-700 font-light">vs</span>
                           <span className="text-2xl font-black tabular-nums">{match.scoreB}</span>
                        </div>
                        <span className={`flex-1 text-center font-black text-sm uppercase truncate ${match.teamBId === id ? "text-cyan-400" : "text-zinc-500"}`}>{match.teamB.name}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="rounded-xl bg-cyan-600 p-5 shadow-xl shadow-cyan-600/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-white font-semibold text-sm mb-0.5">Inter-Classe Master</h4>
               <p className="text-cyan-100 text-[10px] font-medium">Plateforme Live Officielle</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
