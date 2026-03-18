import { MatchStatus } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDashboardData } from "@/lib/tournament";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusLabel(status: MatchStatus) {
  if (status === MatchStatus.LIVE) return "En cours";
  if (status === MatchStatus.PREVU) return "À venir";
  return "Terminé";
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-cyan-500/10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-300">IAI Inter-Classe Master</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Le tournoi de football de l'Institut Africain d'Informatique.
            </p>
          </div>
          <div className="hidden md:block bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full">
            <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest font-bold">Edition 2026</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Matchs en cours", matches: data.liveMatches },
            { title: "Prochains matchs", matches: data.upcomingMatches },
            { title: "Résultats", matches: data.finishedMatches },
          ].map((block) => (
            <article key={block.title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="text-lg font-semibold text-cyan-200">{block.title}</h2>
              <div className="mt-3 space-y-3">
                {block.matches.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aucun match</p>
                ) : (
                  block.matches.map((match) => (
                    <Link 
                      key={match.id} 
                      href={`/matches/${match.id}`}
                      className="block group rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm transition-all hover:border-cyan-500/50 hover:bg-zinc-900 shadow-lg hover:shadow-cyan-500/5"
                    >
                      <div className="flex items-center justify-between gap-2 font-bold mb-3">
                        <span className="flex-1 text-right truncate">{match.teamA.name}</span>
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 group-hover:border-cyan-500/30 transition-colors">
                          <span className="text-white">{match.scoreA}</span>
                          <span className="text-zinc-600">-</span>
                          <span className="text-white">{match.scoreB}</span>
                        </div>
                        <span className="flex-1 text-left truncate">{match.teamB.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                        <span>{statusLabel(match.status)}</span>
                        <span>{format(new Date(match.date), "HH:mm")}</span>
                      </div>

                      <div className="mt-4 space-y-1.5 border-t border-zinc-900 pt-3">
                        {match.events
                          .filter((event) => ["GOAL", "YELLOW", "RED"].includes(event.type))
                          .slice(0, 3)
                          .map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span className="font-bold text-zinc-600 w-4">{event.minute}'</span>
                              <span>{event.type === "GOAL" ? "⚽" : event.type === "YELLOW" ? "🟨" : "🟥"}</span>
                              <span className="truncate">{event.player.firstName} {event.player.lastName}</span>
                            </div>
                          ))}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-semibold text-cyan-300">Classement IAI Master</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="p-2">Équipe</th>
                  <th className="p-2">Pts</th>
                  <th className="p-2">J</th>
                  <th className="p-2">V</th>
                  <th className="p-2">N</th>
                  <th className="p-2">D</th>
                  <th className="p-2">BP</th>
                  <th className="p-2">BC</th>
                  <th className="p-2">Diff</th>
                </tr>
              </thead>
              <tbody>
                {data.standings.map((row) => (
                  <tr key={row.teamId} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-2 font-medium">{row.teamName}</td>
                    <td className="p-2 font-bold text-cyan-200">{row.points}</td>
                    <td className="p-2">{row.played}</td>
                    <td className="p-2">{row.wins}</td>
                    <td className="p-2">{row.draws}</td>
                    <td className="p-2">{row.losses}</td>
                    <td className="p-2">{row.goalsFor}</td>
                    <td className="p-2">{row.goalsAgainst}</td>
                    <td className="p-2">{row.goalDiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold text-cyan-200">Meilleurs Buteurs</h2>
            <div className="mt-3 space-y-2">
              {data.topScorers.map((entry) => (
                <div key={entry.playerId} className="flex justify-between items-center text-sm">
                  <span>{entry.player.firstName} {entry.player.lastName} <span className="text-[10px] text-zinc-500">({entry.player.team.name})</span></span>
                  <span className="font-bold text-cyan-400">{entry.goals} pts</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold text-cyan-200">Meilleurs Passeurs</h2>
            <div className="mt-3 space-y-2">
              {data.topAssists.map((entry) => (
                <div key={entry.playerId} className="flex justify-between items-center text-sm">
                  <span>{entry.player.firstName} {entry.player.lastName} <span className="text-[10px] text-zinc-500">({entry.player.team.name})</span></span>
                  <span className="font-bold text-emerald-400">{entry.assists} assis.</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold text-cyan-200">Discipline</h2>
            <div className="mt-3 space-y-2">
              {data.discipline.map((entry) => {
                const suspended = entry.redCards > 0 || entry.yellowCards >= 2;
                return (
                  <div key={entry.playerId} className="flex justify-between items-center text-sm">
                    <span className={suspended ? "text-rose-400" : ""}>
                      {entry.player.firstName} {entry.player.lastName} {suspended && "🚫"}
                    </span>
                    <span className="text-xs">
                      {entry.yellowCards > 0 && `🟨 ${entry.yellowCards}`} {entry.redCards > 0 && `🟥 ${entry.redCards}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Effectifs & Salles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((team) => (
              <article key={team.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-zinc-100 text-lg">{team.name}</h3>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full text-zinc-400">{team.players.length} joueurs</span>
                </div>
                <p className="text-xs text-zinc-500 italic mb-3">{team.colors || "Couleurs non définies"}</p>
                <div className="space-y-2">
                  {team.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 text-sm text-zinc-300">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-600">#{player.number}</div>
                      )}
                      <div>
                        <p className="font-medium leading-tight">{player.firstName} {player.lastName}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{player.position || "Non assigné"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
