import { cn } from "@/lib/utils";

interface LineupsProps {
  teamA: any;
  teamB: any;
}

export function Lineups({ teamA, teamB }: LineupsProps) {
  const PlayerCard = ({ player, isLeft }: { player: any; isLeft: boolean }) => (
    <div className={cn(
      "flex items-center gap-3 rounded-xl bg-zinc-900/50 p-2.5 border border-zinc-800/50 hover:bg-zinc-800/80 transition-all group",
      !isLeft && "flex-row-reverse text-right"
    )}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-black text-cyan-400 group-hover:scale-110 transition-transform shadow-lg border border-zinc-700">
        #{player.number}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-bold text-white uppercase tracking-tighter">
          {player.firstName} {player.lastName}
        </p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
          {player.position || "Joueur"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Team A Lineup */}
      <section className="space-y-6">
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-zinc-950 p-6 border border-zinc-900 shadow-2xl">
           <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{teamA.name}</h3>
          <span className="text-xs bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-400 font-bold">{teamA.players.length} Joueurs</span>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {teamA.players.map((p: any) => (
            <PlayerCard key={p.id} player={p} isLeft={true} />
          ))}
        </div>
      </section>

      {/* Team B Lineup */}
      <section className="space-y-6">
        <div className="relative flex items-center justify-between flex-row-reverse overflow-hidden rounded-2xl bg-zinc-950 p-6 border border-zinc-900 shadow-2xl">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none" />
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{teamB.name}</h3>
          <span className="text-xs bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-400 font-bold">{teamB.players.length} Joueurs</span>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {teamB.players.map((p: any) => (
            <PlayerCard key={p.id} player={p} isLeft={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
