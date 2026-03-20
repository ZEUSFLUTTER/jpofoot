"use client";

import { useState } from "react";
import { PlayerProfileModal } from "@/components/PlayerProfileModal";

interface TeamRosterProps {
  players: any[];
  teamName: string;
}

export function TeamRoster({ players, teamName }: TeamRosterProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  return (
    <>
      <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
         <h2 className="text-base font-semibold uppercase text-white">Effectif Officiel</h2>
         <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-medium">
           {players.length} Joueurs
         </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {players.map((player) => (
          <div 
            key={player.id} 
            onClick={() => setSelectedPlayer(player)}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:bg-zinc-900 hover:border-cyan-500/30 group cursor-pointer"
          >
            <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-950 shrink-0 shadow group-hover:border-cyan-500/20 transition-all">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
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

      {selectedPlayer && (
        <PlayerProfileModal 
          player={selectedPlayer}
          teamName={teamName}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}
