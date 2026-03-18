"use client";

import { useState } from "react";
import { CoachEditPlayer } from "./CoachEditPlayer";

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
        <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Effectif</h2>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full border border-cyan-500/20 font-bold uppercase">{players.length} Joueurs</span>
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <CoachEditPlayer player={editingPlayer} onCancel={() => setEditingPlayer(null)} />
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 py-8 uppercase tracking-widest font-bold">Aucun joueur dans cet effectif</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-black text-zinc-700 border border-zinc-800 group-hover:text-cyan-500 group-hover:border-cyan-500/20 transition-all">
                  #{player.number}
                </div>
                <div>
                  <p className="font-black text-zinc-100 group-hover:text-white transition-colors capitalize">{player.firstName} {player.lastName}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">{player.position || "Non assigné"}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPlayer(player)}
                className="text-xs font-bold text-cyan-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest"
              >
                Modifier
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
