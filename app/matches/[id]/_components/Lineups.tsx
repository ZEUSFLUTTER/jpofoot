import { cn } from "@/lib/utils";
import Pitch from "@/components/Pitch";
import { Users, Shield, Layout, Settings, User } from "lucide-react";
import { useState } from "react";
import { PlayerProfileModal } from "@/components/PlayerProfileModal";

interface LineupsProps {
  teamA: any;
  teamB: any;
  match: any;
}

export function Lineups({ teamA, teamB, match }: LineupsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");

  const handlePlayerClick = (player: any, teamName: string) => {
    setSelectedPlayer(player);
    setSelectedTeamName(teamName);
  };

  const getLineupData = (teamId: string, isTeamA: boolean) => {
    const lineup = match.lineups?.[isTeamA ? 'teamA' : 'teamB'];
    const team = isTeamA ? teamA : teamB;
    
    if (!lineup || !lineup.isPublished) return { players: team.players, isFullSquad: true };
    
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

  const PlayerCard = ({ player, isLeft, colorClass, teamName }: { player: any; isLeft: boolean; colorClass: string; teamName: string }) => (
    <div 
      onClick={() => handlePlayerClick(player, teamName)}
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-zinc-900 px-4 py-3 border border-zinc-800 hover:bg-zinc-800/80 transition-all group hover:border-cyan-500/20 shadow-lg cursor-pointer",
        !isLeft && "flex-row-reverse text-right"
      )}
    >
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 font-black text-sm group-hover:scale-110 transition-transform border border-zinc-700 overflow-hidden relative",
        colorClass
      )}>
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.lastName} className="h-full w-full object-cover" />
        ) : (
          player.number
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-xs font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
          {player.firstName} {player.lastName}
        </p>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mt-0.5">
          {player.position || "Joueur"}
        </p>
      </div>
    </div>
  );

  const TeamSection = ({ team, data, isLeft }: { team: any; data: any; isLeft: boolean }) => (
    <section className="space-y-8">
      <div className={cn(
        "relative flex items-center justify-between overflow-hidden rounded-[2rem] bg-zinc-950 p-8 border border-zinc-900 shadow-2xl",
        !isLeft && "flex-row-reverse"
      )}>
        <div className={cn(
          "absolute top-0 h-full w-1/2 pointer-events-none opacity-20",
          isLeft ? "right-0 bg-gradient-to-l from-cyan-500/20 to-transparent" : "left-0 bg-gradient-to-r from-rose-500/20 to-transparent"
        )} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} className={isLeft ? "text-cyan-500" : "text-rose-500"} />
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{team.name}</h3>
          </div>
          {data.formation && (
            <div className="flex items-center gap-2">
              <Layout size={12} className="text-zinc-600" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] italic">Système {data.formation}</p>
            </div>
          )}
        </div>
        <div className="relative z-10 flex flex-col items-end gap-2">
          <span className="text-[10px] bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 text-zinc-500 font-black uppercase tracking-widest shadow-inner">
            {data.isFullSquad ? "Effectif Complet" : "Onze de Départ"}
          </span>
        </div>
      </div>
      
      {data.isFullSquad ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {team.players.map((p: any) => (
            <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} teamName={team.name} />
          ))}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-8 lg:gap-12", !isLeft && "lg:flex-row-reverse", isLeft && "lg:flex-row")}>
          {/* Main Column: Pitch & Starters */}
          <div className="flex-1 space-y-8 min-w-0">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-b from-cyan-500/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative rounded-[2.5rem] border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-sm overflow-hidden">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Settings size={14} className="text-cyan-500 animate-spin-slow" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Positionnement Tactique</span>
                    </div>
                    <div className="h-px flex-1 bg-zinc-900 mx-6 opacity-50" />
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{data.formation}</span>
                 </div>
                 <Pitch 
                   players={data.starters} 
                   positions={data.positions} 
                   isEditable={false} 
                   onClickPlayer={(p) => handlePlayerClick(p, team.name)}
                 />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="h-px flex-1 bg-zinc-900" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Onze de Départ</h4>
                 <div className="h-px flex-1 bg-zinc-900" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.starters.map((p: any) => (
                  <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} teamName={team.name} />
                ))}
              </div>
            </div>
          </div>

          {/* Side Column: Coach & Substitutes */}
          <div className="w-full lg:w-80 space-y-8 shrink-0">
            {/* Coach Card */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                 <div className="h-px flex-1 bg-zinc-900" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Entraîneur</h4>
                 <div className="h-px flex-1 bg-zinc-900" />
               </div>
               <div className={cn("flex items-center gap-4 rounded-2xl bg-zinc-900 px-4 py-3 border border-zinc-800 shadow-lg", !isLeft && "flex-row-reverse text-right")}>
                 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700">
                   {team.coachPhotoUrl ? (
                     <img src={team.coachPhotoUrl} alt="Coach" className="h-full w-full object-cover" />
                   ) : (
                     <User size={20} className="text-zinc-500" />
                   )}
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <p className="truncate text-xs font-black text-white uppercase">{team.coachFirstName} {team.coachLastName}</p>
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Coach</p>
                 </div>
               </div>
            </div>

            {/* Substitutes */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="h-px flex-1 bg-zinc-900" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Banc de Touche</h4>
                 <div className="h-px flex-1 bg-zinc-900" />
              </div>
              <div className="grid gap-3">
                {data.substitutes.map((p: any) => (
                  <PlayerCard key={p.id} player={p} isLeft={isLeft} colorClass={isLeft ? "text-cyan-400" : "text-rose-400"} teamName={team.name} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      <div className="space-y-16">
        <TeamSection team={teamA} data={dataA} isLeft={true} />
        <TeamSection team={teamB} data={dataB} isLeft={false} />
      </div>

      {selectedPlayer && (
        <PlayerProfileModal 
          player={selectedPlayer}
          teamName={selectedTeamName}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}
