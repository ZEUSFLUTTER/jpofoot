import { Activity, History, Shield, TrendingUp } from "lucide-react";
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
      "flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black shadow-lg transition-transform hover:scale-110",
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
    <div className="space-y-16 mt-8">
      {/* Visual Compositions (Pitch) */}
      {(lineupA || lineupB) && (
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Compositions Stratégiques</h3>
            <div className="h-px flex-1 bg-zinc-900" />
            <Shield size={20} className="text-cyan-500 opacity-50" />
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {[ { team: match.teamA, lineup: lineupA, color: "text-cyan-400" }, { team: match.teamB, lineup: lineupB, color: "text-rose-400" }].map((item, idx) => (
              <div key={idx} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{item.team.name}</p>
                   {item.lineup && <span className="text-[10px] font-black italic text-zinc-600 uppercase tracking-widest">{item.lineup.formation}</span>}
                </div>
                {item.lineup ? (
                  <div className="relative group p-6 rounded-[2.5rem] border border-zinc-800 bg-zinc-950/40 shadow-2xl backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <Pitch players={item.lineup.starters} positions={item.lineup.positions} isEditable={false} />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-zinc-900 bg-zinc-950/20 px-8 text-center transition-colors hover:border-zinc-800">
                    <Shield size={32} className="text-zinc-800 mb-4" />
                    <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.2em]">Composition non disponible</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Form Section */}
        <section className="space-y-8 p-1 rounded-[2rem] bg-gradient-to-br from-zinc-800/50 to-transparent">
          <div className="bg-zinc-950 rounded-[1.8rem] p-8 border border-zinc-800/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp size={20} className="text-emerald-500" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Forme Récente</h3>
            </div>
            
            <div className="space-y-6">
              {[ { team: match.teamA, id: match.teamAId, form: teamAForm }, { team: match.teamB, id: match.teamBId, form: teamBForm } ].map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{item.team.name}</span>
                    <div className="flex gap-1.5">
                      {item.form.slice(0, 5).map((m, i) => (
                        <ResultIcon key={i} result={getResult(m, item.id)} />
                      ))}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                     <div className={cn("h-full bg-gradient-to-r transition-all duration-1000", idx === 0 ? "from-cyan-500/50 to-cyan-500" : "from-rose-500/50 to-rose-500")} style={{ width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* H2H Section */}
        {h2hMatches.length > 0 && (
          <section className="space-y-8 p-1 rounded-[2rem] bg-gradient-to-br from-rose-500/10 to-transparent">
            <div className="bg-zinc-950 rounded-[1.8rem] p-8 border border-zinc-800/50 shadow-2xl h-full">
              <div className="flex items-center gap-3 mb-8">
                <History size={20} className="text-rose-500" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Face à Face</h3>
              </div>
              
              <div className="space-y-3">
                {h2hMatches.map((m) => (
                  <div key={m.id} className="group relative overflow-hidden rounded-2xl bg-zinc-900/30 p-4 border border-zinc-800/50 hover:bg-zinc-900 transition-all">
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <span suppressHydrationWarning className="text-[10px] text-zinc-600 font-black uppercase tracking-tighter w-12">
                        {format(new Date(m.date), "dd/MM/yy")}
                      </span>
                      <div className="flex flex-1 items-center justify-center gap-4">
                        <span className={cn("flex-1 text-right text-xs font-black uppercase tracking-tight truncate", m.teamAId === match.teamAId ? "text-cyan-400" : "text-zinc-500")}>{m.teamA.name}</span>
                        <span className="flex h-8 w-14 items-center justify-center rounded-lg bg-zinc-950 font-black text-sm text-white border border-zinc-800 group-hover:scale-110 transition-transform shadow-inner">
                          {m.scoreA} - {m.scoreB}
                        </span>
                        <span className={cn("flex-1 text-left text-xs font-black uppercase tracking-tight truncate", m.teamBId === match.teamAId ? "text-cyan-400" : "text-zinc-500")}>{m.teamB.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
