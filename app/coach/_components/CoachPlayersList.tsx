"use client";

import { useState } from "react";
import { CoachEditPlayer } from "./CoachEditPlayer";
import { Users, User, Edit3 } from "lucide-react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position?: string | null;
  photoUrl?: string | null;
};

export function CoachPlayersList({ players }: { players: Player[] }) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-cyan-500" />
          <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Effectif</h2>
        </div>
        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full border border-cyan-500/20 font-bold uppercase tracking-widest leading-none">{players.length} Joueurs</span>
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <CoachEditPlayer player={editingPlayer} onCancel={() => setEditingPlayer(null)} />
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
           <User size={48} className="mb-4 opacity-20" />
           <p className="text-sm uppercase tracking-widest font-bold">Aucun joueur dans cet effectif</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-cyan-500/40 transition-all relative overflow-hidden">
                  {player.photoUrl ? (
                    <>
                      <img src={player.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/40" />
                      <span className="relative z-10 text-xs font-black text-white drop-shadow-md">#{player.number}</span>
                    </>
                  ) : (
                    <span className="text-sm font-black text-zinc-700 group-hover:text-cyan-500 transition-colors">#{player.number}</span>
                  )}
                </div>
                <div>
                  <p className="font-black text-zinc-100 group-hover:text-white transition-colors capitalize">{player.firstName} {player.lastName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{player.position || "Non assigné"}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPlayer(player)}
                className="flex items-center gap-1.5 text-[10px] font-black text-cyan-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest"
              >
                <Edit3 size={12} />
                Modifier
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
