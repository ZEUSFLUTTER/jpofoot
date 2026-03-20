import { MatchStatus } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDashboardData } from "@/lib/tournament";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Target, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === MatchStatus.LIVE) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-500 border border-rose-500/20">
        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
        En direct
      </span>
    );
  }
  if (status === MatchStatus.PREVU) {
    return (
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-700">
        À venir
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20">
      Terminé
    </span>
  );
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10 font-primary selection:bg-cyan-500/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
        {/* Header Section */}
        <header className="relative flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl overflow-hidden md:flex-row">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white uppercase leading-tight">
              inter filiere <span className="text-cyan-500">IAI</span>
            </h1>
            <p className="mt-2 text-zinc-400 font-normal max-w-xl text-sm">
              Vivez l'intensité du tournoi en direct. Scores, classements et performances individuelles en temps réel.
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 backdrop-blur-md text-center min-w-[90px]">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Équipes</p>
                <p className="text-xl font-bold text-white">{data.teams.length}</p>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 backdrop-blur-md text-center min-w-[90px]">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Matchs</p>
                <p className="text-xl font-bold text-white">{data.allMatches.length}</p>
             </div>
          </div>
        </header>

        {/* Live & Upcoming Matches */}
        <section className="grid gap-8 lg:grid-cols-3">
          {[
            { title: "En Direct", matches: data.liveMatches, accent: "rose" },
            { title: "Prochains Matchs", matches: data.upcomingMatches, accent: "zinc" },
            { title: "Résultats", matches: data.finishedMatches, accent: "emerald" },
          ].map((block) => (
            <article key={block.title} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2 shadow-xl backdrop-blur-sm">
              <div className="p-5">
                <h2 className="text-base font-semibold uppercase text-white border-b border-zinc-800 pb-2 mb-3">
                  {block.title}
                </h2>
                <div className="space-y-4">
                  {block.matches.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Aucun match disponible</p>
                    </div>
                  ) : (
                    block.matches.map((match) => (
                      <Link 
                        key={match.id} 
                        href={`/matches/${match.id}`}
                        className="group relative block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-cyan-500/50 hover:bg-zinc-900 hover:-translate-y-1 active:scale-[0.98]"
                      >
                        <div className="mb-3 flex justify-between items-center">
                           <StatusBadge status={match.status as MatchStatus} />
                           <span suppressHydrationWarning className="text-[10px] font-black uppercase tracking-widest text-zinc-500 tabular-nums">
                              {format(new Date(match.date), "HH:mm")}
                           </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex-1 text-center text-xs font-black uppercase tracking-tight truncate text-zinc-300 group-hover:text-white transition-colors">{match.teamA.name}</span>
                          <div className="flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 border border-zinc-800 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-colors">
                            <span className="text-base font-black tabular-nums tracking-tighter">{match.scoreA} - {match.scoreB}</span>
                          </div>
                          <span className="flex-1 text-center text-xs font-black uppercase tracking-tight truncate text-zinc-300 group-hover:text-white transition-colors">{match.teamB.name}</span>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                           {match.events.filter((e: any) => e.type === "GOAL").slice(0, 3).map((e: any) => (
                             <span key={e.id} className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-tighter">
                               <Target size={10} className="text-emerald-400" /> {e.player.lastName} ({e.minute}')
                             </span>
                           ))}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/40 transition-all" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Standings Section */}
        <section className="space-y-8">
          {/* General Standings */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
              <h2 className="text-lg font-black uppercase text-white italic tracking-tighter">Classement Général</h2>
              <div className="flex gap-2 items-center">
                <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Updates</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Rang</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Équipe</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Pts</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">J</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">V</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">N</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">D</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">BP</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">BC</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {data.standings.map((row, i) => (
                    <tr key={row.teamId} className="hover:bg-zinc-900 transition-colors group">
                      <td className="px-4 py-3">
                         <span className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-black border ${i < 3 ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
                           {i + 1}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                             {row.logoUrl ? <img src={row.logoUrl} className="h-full w-full object-cover" /> : <span className="text-[9px] font-medium text-zinc-600">{row.teamName.charAt(0)}</span>}
                           </div>
                           <span className="text-xs font-black uppercase text-white group-hover:text-cyan-400 transition-colors">{row.teamName}</span>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                         <span className="text-sm font-black text-cyan-400 tabular-nums">{row.points}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-400 tabular-nums">{row.played}</td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-300 tabular-nums">{row.wins}</td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-500 tabular-nums">{row.draws}</td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-500 tabular-nums">{row.losses}</td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-400 tabular-nums">{row.goalsFor}</td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-400 tabular-nums">{row.goalsAgainst}</td>
                      <td className="px-4 py-3 text-center">
                         <span className={`text-[10px] font-black tabular-nums ${row.goalDiff > 0 ? "text-emerald-400" : row.goalDiff < 0 ? "text-rose-400" : "text-zinc-500"}`}>
                           {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Group Standings */}
          <div className="grid gap-8 lg:grid-cols-2">
            {Object.entries(
              data.standings.reduce((acc, row) => {
                const team = data.teams.find(t => t.id === row.teamId);
                const poule = team?.poule || "Sans Poule";
                if (!acc[poule]) acc[poule] = [];
                acc[poule].push(row);
                return acc;
              }, {} as Record<string, any[]>)
            ).sort().map(([poule, rows]) => (
              <div key={poule} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
                <h3 className="text-sm font-black uppercase italic tracking-tighter text-white mb-4 border-l-4 border-cyan-500 pl-3">
                  {poule}
                </h3>
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="px-3 py-2 text-[9px] font-black uppercase text-zinc-500">Rang</th>
                        <th className="px-3 py-2 text-[9px] font-black uppercase text-zinc-500">Équipe</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black uppercase text-zinc-500">Pts</th>
                        <th className="px-3 py-2 text-center text-[9px] font-black uppercase text-zinc-500">Diff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {rows.map((row, i) => (
                        <tr key={row.teamId} className="hover:bg-zinc-900/50 transition-colors group">
                          <td className="px-3 py-2">
                             <span className="text-[10px] font-black text-zinc-600">{i + 1}.</span>
                          </td>
                          <td className="px-3 py-2 flex items-center gap-2">
                            <div className="h-4 w-4 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                               {row.logoUrl ? <img src={row.logoUrl} className="h-full w-full object-cover" /> : <span className="text-[6px] font-medium text-zinc-600">{row.teamName.charAt(0)}</span>}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-300 group-hover:text-white transition-colors truncate max-w-[120px]">{row.teamName}</span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs font-black text-cyan-400">{row.points}</td>
                          <td className="px-3 py-2 text-center text-[10px] font-black text-zinc-500">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Individual Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Meilleurs Buteurs", items: data.topScorers, val: "goals", color: "text-emerald-400" },
            { title: "Meilleurs Passeurs", items: data.topAssists, val: "assists", color: "text-cyan-400" },
            { title: "Discipline", items: data.discipline, type: "cards" },
          ].map((stat) => (
            <section key={stat.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 shadow-xl backdrop-blur-sm hover:border-cyan-500/20 transition-all duration-300">
              <h2 className="text-sm font-semibold uppercase text-white mb-4 flex items-center gap-2">
                <span className="bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 text-sm flex items-center justify-center">
                  {stat.title === "Meilleurs Buteurs" && <Target size={16} className="text-emerald-400" />}
                  {stat.title === "Meilleurs Passeurs" && <Shield size={16} className="text-cyan-400" />}
                  {stat.title === "Discipline" && <div className="h-3 w-2.5 rounded-sm bg-amber-400 border border-amber-500/50 shadow-sm" />}
                </span>
                {stat.title}
              </h2>
              <div className="space-y-2">
                {stat.items.map((entry, idx) => (
                  <div key={entry.playerId} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3 group hover:border-cyan-500/20 transition-all">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-600 w-4">{idx + 1}.</span>
                        <div>
                          <p className="font-semibold text-white text-xs group-hover:text-cyan-400 transition-colors">{entry.player.firstName} {entry.player.lastName}</p>
                          <p className="text-[9px] font-medium text-zinc-500">{entry.player.team.name}</p>
                        </div>
                     </div>
                     {stat.type === "cards" ? (
                       <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                             <span className="h-3 w-2 bg-amber-400 rounded-sm" />
                             <span className="text-xs font-semibold tabular-nums">{(entry as any).yellowCards}</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <span className="h-3 w-2 bg-rose-500 rounded-sm" />
                             <span className="text-xs font-semibold tabular-nums">{(entry as any).redCards}</span>
                          </div>
                       </div>
                     ) : (
                       <span className={`text-base font-bold tabular-nums ${stat.color}`}>{(entry as any)[stat.val!]}</span>
                     )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Teams Fleet List */}
        <section className="rounded-2xl border border-zinc-100/5 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
           <div className="flex justify-between items-end mb-6">
              <h2 className="text-lg font-semibold uppercase text-white">Les Équipes</h2>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide hidden md:block">Effectifs Officiels</p>
           </div>
           
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.teams.map((team) => (
              <a 
                key={team.id} 
                href={`/teams/${team.id}`}
                className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition-all hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="absolute top-0 right-0 p-3">
                   <span className="text-[10px] font-medium text-zinc-700 group-hover:text-cyan-500 transition-colors">{team.players.length} JP</span>
                </div>
                <div className="flex flex-col items-center text-center gap-4">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="h-16 w-16 rounded-2xl object-cover border-2 border-zinc-800 shadow-lg group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600 font-bold text-3xl border-2 border-zinc-800">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase group-hover:text-cyan-400 transition-colors">{team.name}</h3>
                    <p className="mt-0.5 text-[10px] font-normal text-zinc-600">
                      {team.coachFirstName} {team.coachLastName}
                    </p>
                  </div>
                  <div className="w-full h-px bg-zinc-800 group-hover:bg-cyan-500/20 transition-colors" />
                  <div className="flex items-center gap-1.5 text-cyan-500 font-medium text-[10px] uppercase opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                     Voir profil
                     <span>→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Footer Section */}
        
        <footer className="py-8 text-center border-t border-zinc-900">
           <p className="text-[10px] font-normal text-zinc-600">© 2026 inter filiere IAI • IAI Football Foundation</p>
        </footer>
      </div>
    </main>
  );
}
