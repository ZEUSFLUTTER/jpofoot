import { MatchStatus } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AdminPanel } from "@/app/_components/admin-panel";
import { getDashboardData } from "@/lib/tournament";

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
        <header className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-cyan-500/10">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-300">Inter-Classe Master</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Suivi en temps réel des matchs, classements et statistiques individuelles.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "En cours", matches: data.liveMatches },
            { title: "À venir", matches: data.upcomingMatches },
            { title: "Terminés", matches: data.finishedMatches },
          ].map((block) => (
            <article key={block.title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="text-lg font-semibold text-cyan-200">{block.title}</h2>
              <div className="mt-3 space-y-3">
                {block.matches.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aucun match</p>
                ) : (
                  block.matches.map((match) => (
                    <div key={match.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
                      <p className="font-semibold">
                        {match.teamA.name} {match.scoreA} - {match.scoreB} {match.teamB.name}
                      </p>
                      <p className="text-zinc-400">
                        {format(new Date(match.date), "EEE d MMM yyyy, HH:mm", { locale: fr })} • {statusLabel(match.status)}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-zinc-400">
                        {match.events
                          .filter((event) => ["GOAL", "YELLOW", "RED"].includes(event.type))
                          .slice(0, 4)
                          .map((event) => (
                            <p key={event.id}>
                              {event.minute}&apos; {event.type} • {event.player.firstName} {event.player.lastName}
                              {event.relatedTo ? ` (Passe: ${event.relatedTo.firstName} ${event.relatedTo.lastName})` : ""}
                            </p>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-semibold text-cyan-300">Classement dynamique</h2>
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
                  <tr key={row.teamId} className="border-t border-zinc-800">
                    <td className="p-2">{row.teamName}</td>
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
            <h2 className="text-lg font-semibold text-cyan-200">Top 10 Buteurs</h2>
            <div className="mt-3 space-y-1 text-sm">
              {data.topScorers.map((entry) => (
                <p key={entry.playerId}>
                  {entry.player.firstName} {entry.player.lastName} ({entry.player.team.name}) • {entry.goals}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold text-cyan-200">Top 10 Passeurs</h2>
            <div className="mt-3 space-y-1 text-sm">
              {data.topAssists.map((entry) => (
                <p key={entry.playerId}>
                  {entry.player.firstName} {entry.player.lastName} ({entry.player.team.name}) • {entry.assists}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold text-cyan-200">Discipline</h2>
            <div className="mt-3 space-y-1 text-sm">
              {data.discipline.map((entry) => {
                const suspended = entry.redCards > 0 || entry.yellowCards >= 2;
                return (
                  <p key={entry.playerId}>
                    {entry.player.firstName} {entry.player.lastName} • 🟨 {entry.yellowCards} / 🟥 {entry.redCards}
                    {suspended ? " • Suspendu" : ""}
                  </p>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-semibold text-cyan-300">Effectifs par équipe</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.teams.map((team) => (
              <a 
                key={team.id} 
                href={`/teams/${team.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="flex items-center gap-3">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">{team.name}</h3>
                    <p className="text-xs text-zinc-500">{team.players.length} Joueurs</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <AdminPanel teams={data.teams} matches={data.allMatches} />
      </div>
    </main>
  );
}
