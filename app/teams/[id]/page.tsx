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
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col md:flex-row items-center gap-6 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8 shadow-lg shadow-cyan-500/10">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="h-24 w-24 rounded-2xl object-cover border-2 border-zinc-800" />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 text-4xl font-bold border-2 border-zinc-800">
              {team.name.charAt(0)}
            </div>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-cyan-300">{team.name}</h1>
            <p className="mt-2 text-lg text-zinc-400">
              Coach: <span className="text-zinc-100">{team.coachFirstName} {team.coachLastName}</span>
            </p>
            {team.colors && (
              <p className="mt-1 text-sm text-zinc-500">Couleurs: {team.colors}</p>
            )}
          </div>
          <div className="ml-auto">
             <a href="/" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">← Retour à l'accueil</a>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          <section className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-cyan-200 border-b border-zinc-800 pb-2">Effectif ({team.players.length} joueurs)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {team.players.map((player) => (
                <div key={player.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-900">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-950 shrink-0">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700 font-bold text-xl">
                        {player.number}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100">
                      <span className="text-cyan-400 mr-2">#{player.number}</span>
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="text-sm text-zinc-400">{player.position || "Poste non défini"}</p>
                    {player.stats && (
                      <div className="mt-1 flex gap-3 text-[10px] uppercase font-bold text-zinc-500">
                        <span>⚽ {player.stats.goals}</span>
                        <span>🎯 {player.stats.assists}</span>
                        <span>🟨 {player.stats.yellowCards}</span>
                        <span>🟥 {player.stats.redCards}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-cyan-200 border-b border-zinc-800 pb-2">Derniers Matchs</h2>
            <div className="space-y-4">
              {team.lastMatches.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">Aucun match terminé pour le moment.</p>
              ) : (
                team.lastMatches.map((match: any) => {
                   const isWin = (match.teamAId === id && match.scoreA > match.scoreB) || (match.teamBId === id && match.scoreB > match.scoreA);
                   const isLoss = (match.teamAId === id && match.scoreA < match.scoreB) || (match.teamBId === id && match.scoreB < match.scoreA);

                  return (
                    <div key={match.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">
                          {format(match.date, "d MMM yyyy", { locale: fr })}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isWin ? "bg-emerald-500/10 text-emerald-500" : isLoss ? "bg-rose-500/10 text-rose-500" : "bg-zinc-500/10 text-zinc-400"}`}>
                          {isWin ? "Victoire" : isLoss ? "Défaite" : "Nul"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span className={match.teamAId === id ? "text-cyan-300" : "text-zinc-300"}>{match.teamA.name}</span>
                        <span className="text-lg bg-zinc-950 px-3 py-1 rounded border border-zinc-800">{match.scoreA} - {match.scoreB}</span>
                        <span className={match.teamBId === id ? "text-cyan-300" : "text-zinc-300"}>{match.teamB.name}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
