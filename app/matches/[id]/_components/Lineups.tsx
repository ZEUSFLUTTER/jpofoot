import { cn } from "@/lib/utils";
import Pitch from "@/components/Pitch";

interface LineupsProps {
  teamA: any;
  teamB: any;
  match: any;
}

export function Lineups({ teamA, teamB, match }: LineupsProps) {
  const getLineupData = (teamId: string, isTeamA: boolean) => {
    const lineup = match.lineups?.[isTeamA ? 'teamA' : 'teamB'];
    const team = isTeamA ? teamA : teamB;
    
    if (!lineup) return { players: team.players, isFullSquad: true };
    
    const starters = team.players.filter((p: any) => lineup.starting11.includes(p.id));
    const substitutes = team.players.filter((p: any) => lineup.substitutes.includes(p.id));
    
    return { 
      starters, 
      substitutes, 
      formation: lineup.formation, 
      positions: lineup.positions || {},
      isFullSquad: false 
    };
  };

  const dataA = getLineupData(match.teamAId, true);
  const dataB = getLineupData(match.teamBId, false);

  const PlayerCard = ({ player, isLeft, colorClass }: { player: any; isLeft: boolean; colorClass: string }) => (
    <div className={cn(
      "flex items-center gap-4 rounded-2xl bg-zinc-900 px-4 py-3 border border-zinc-800 hover:bg-zinc-800/80 transition-all group hover:border-cyan-500/20",
      !isLeft && "flex-row-reverse text-right"
    )}>
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 font-black text-lg group-hover:scale-110 transition-transform shadow-2xl border-2 border-zinc-700", colorClass)}>
        {player.number}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
          {player.firstName} {player.lastName}
        </p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mt-0.5">
          {player.position || "Joueur"}
        </p>
      </div>
    </div>
  );

  const TeamSection = ({ team, data, isLeft }: { team: any; data: any; isLeft: boolean }) => (
    <section className="space-y-6">
      <div className={cn(
        "relative flex items-center justify-between overflow-hidden rounded-2xl bg-zinc-950 p-6 border border-zinc-900 shadow-2xl",
        !isLeft && "flex-row-reverse"
      )}>
        <div className={cn(
          "absolute top-0 h-full w-1/3 pointer-events-none",
          isLeft ? "right-0 bg-gradient-to-l from-cyan-500/10 to-transparent" : "left-0 bg-gradient-to-r from-rose-500/10 to-transparent"
        )} />
        <div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{team.name}</h3>
          {data.formation && <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1 italic">Formation {data.formation}</p>}
        </div>
        <span className="text-xs bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-400 font-bold">
          {data.isFullSquad ? `Effectif (${team.players.length})` : "Composition"}
        </span>
      </div>
      
      {data.isFullSquad ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {team.players.map((p: any) => (
            <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pitch Visualization */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-2xl">
            <Pitch 
              players={data.starters} 
              positions={data.positions} 
              isEditable={false} 
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
              <span className="h-px flex-1 bg-zinc-900" />
              Onze de Départ
              <span className="h-px flex-1 bg-zinc-900" />
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.starters.map((p: any) => (
                <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} />
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
              <span className="h-px flex-1 bg-zinc-900" />
              Remplaçants
              <span className="h-px flex-1 bg-zinc-900" />
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.substitutes.map((p: any) => (
                <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <div className="grid gap-12 xl:grid-cols-2">
      <TeamSection team={teamA} data={dataA} isLeft={true} />
      <TeamSection team={teamB} data={dataB} isLeft={false} />
    </div>
  );
}
