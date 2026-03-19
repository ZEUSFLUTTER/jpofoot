import { MatchStatus } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Pitch from "@/components/Pitch";

interface PreMatchInfoProps {
  match: any;
  h2hMatches: any[];
  teamAForm: any[];
  teamBForm: any[];
}

export function PreMatchInfo({ match, h2hMatches, teamAForm, teamBForm }: PreMatchInfoProps) {
  const getResult = (m: any, teamId: string) => {
    if (m.scoreA === m.scoreB) return "D";
    const isTeamA = m.teamAId === teamId;
    if (isTeamA) return m.scoreA > m.scoreB ? "W" : "L";
    return m.scoreB > m.scoreA ? "W" : "L";
  };

  const ResultIcon = ({ result }: { result: string }) => (
    <div className={cn(
      "flex h-6 w-6 items-center justify-center rounded-sm text-[10px] font-black shadow-lg",
      result === "W" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
      result === "L" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
      "bg-zinc-800 text-zinc-400 border border-zinc-700"
    )}>
      {result}
    </div>
  );

  const getTeamLineup = (isTeamA: boolean) => {
    const lineup = match.lineups?.[isTeamA ? 'teamA' : 'teamB'];
    const team = isTeamA ? match.teamA : match.teamB;
    if (!lineup || !lineup.starting11) return null;
    
    const starters = team.players.filter((p: any) => lineup.starting11.includes(p.id));
    return { starters, positions: lineup.positions || {}, formation: lineup.formation };
  };

  const lineupA = getTeamLineup(true);
  const lineupB = getTeamLineup(false);

  return (
    <div className="space-y-12">
      {/* Visual Compositions (Pitch) */}
      {(lineupA || lineupB) && (
        <section className="space-y-8">
          <h3 className="text-xl font-bold text-white group flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-cyan-500" />
            Compositions Stratégiques
          </h3>
          <div className="grid gap-8 lg:grid-cols-2">
            {lineupA ? (
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{match.teamA.name} ({lineupA.formation})</p>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-2xl">
                  <Pitch players={lineupA.starters} positions={lineupA.positions} isEditable={false} />
                </div>
              </div>
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 text-xs text-zinc-600 font-bold uppercase tracking-widest text-center px-8">
                Composition {match.teamA.name} non disponible
              </div>
            )}
            
            {lineupB ? (
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{match.teamB.name} ({lineupB.formation})</p>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-2xl">
                  <Pitch players={lineupB.starters} positions={lineupB.positions} isEditable={false} />
                </div>
              </div>
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 text-xs text-zinc-600 font-bold uppercase tracking-widest text-center px-8">
                Composition {match.teamB.name} non disponible
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white group flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-cyan-500" />
            Forme Récente
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800/50">
              <span className="font-bold text-zinc-300">{match.teamA.name}</span>
              <div className="flex gap-1.5">
                {teamAForm.slice(0, 5).map((m, idx) => (
                  <ResultIcon key={idx} result={getResult(m, match.teamAId)} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800/50">
              <span className="font-bold text-zinc-300">{match.teamB.name}</span>
              <div className="flex gap-1.5">
                {teamBForm.slice(0, 5).map((m, idx) => (
                  <ResultIcon key={idx} result={getResult(m, match.teamBId)} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* H2H Section - Only show if matches exist */}
        {h2hMatches.length > 0 && (
          <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white group flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-rose-500" />
              Face à Face (H2H)
            </h3>
            
            <div className="space-y-2">
              {h2hMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-zinc-950/50 p-3 text-sm border border-zinc-800/30 hover:border-zinc-700 transition-colors group">
                  <span className="text-xs text-zinc-500 font-mono">
                    {format(new Date(m.date), "dd/MM/yy")}
                  </span>
                  <div className="flex flex-1 items-center justify-center gap-3">
                    <span className={cn("flex-1 text-right font-medium", m.teamAId === match.teamAId ? "text-cyan-400" : "text-zinc-400")}>{m.teamA.name}</span>
                    <span className="rounded-lg bg-zinc-800 px-3 py-1 font-black text-white group-hover:scale-110 transition-transform">
                      {m.scoreA} - {m.scoreB}
                    </span>
                    <span className={cn("flex-1 text-left font-medium", m.teamBId === match.teamAId ? "text-cyan-400" : "text-zinc-400")}>{m.teamB.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
