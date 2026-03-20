"use client";

import { Shield, Target, AlertTriangle } from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: number | string;
  position?: string;
  photoUrl?: string;
  stats?: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

interface PlayerProfileModalProps {
  player: Player;
  teamName: string;
  onClose: () => void;
}

export function PlayerProfileModal({ player, teamName, onClose }: PlayerProfileModalProps) {
  const getAncienClub = (name: string) => {
    if (!name) return "Inconnu";
    const lower = name.toLowerCase();
    if (lower.includes("asr") || lower.includes("glsi")) return "TC2";
    if (lower.includes("l2")) return "L1";
    if (lower.includes("l1")) return "Centre de formation lycée";
    return "Inconnu";
  };

  const ancienClub = getAncienClub(teamName);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-cyan-500/10 animate-in zoom-in-95 duration-200 ease-out">
        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-cyan-600/20 to-zinc-900 border-b border-zinc-800" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-black/80 transition-all font-black text-xs"
        >
          ✕
        </button>

        <div className="relative z-10 p-8 pt-12 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4 h-32 w-32 shrink-0 rounded-[2rem] border-4 border-zinc-950 bg-zinc-800 shadow-2xl overflow-hidden shadow-cyan-500/20">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 font-black text-5xl text-zinc-700">
                {player.number}
              </div>
            )}
            <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-zinc-950 shadow-lg">
              <span className="text-xs font-black text-zinc-950 px-1">#{player.number}</span>
            </div>
          </div>

          {/* Name & Position */}
          <div className="text-center mb-6 w-full">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white line-clamp-2 leading-none mb-2">
              {player.firstName} <span className="text-cyan-400">{player.lastName}</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 bg-zinc-900/50 py-1.5 px-3 rounded-full inline-block border border-zinc-800 px-4">
              {player.position || "Joueur"}
            </p>
          </div>

          {/* Stats Bar */}
          {player.stats && (
            <div className="w-full grid grid-cols-3 gap-2 p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 mb-6 backdrop-blur-md shadow-inner">
               <div className="flex flex-col items-center justify-center py-1">
                 <Target size={14} className="text-emerald-400 mb-1" />
                 <span className="text-lg font-black text-white">{player.stats.goals}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Buts</span>
               </div>
               <div className="flex flex-col items-center justify-center border-x border-zinc-800/50 py-1">
                 <Shield size={14} className="text-cyan-400 mb-1" />
                 <span className="text-lg font-black text-white">{player.stats.assists}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">P.D.</span>
               </div>
               <div className="flex flex-col items-center justify-center py-1">
                 <AlertTriangle size={14} className="text-amber-500 mb-1" />
                 <span className="text-lg font-black text-white">{player.stats.yellowCards + player.stats.redCards}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Cartons</span>
               </div>
            </div>
          )}

          {/* Ancien Club Info */}
          <div className="w-full rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 text-center shadow-lg hover:border-cyan-500/30 transition-colors">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center justify-center gap-1.5">
              <span className="w-2 h-px bg-zinc-700" />
              Ancien Club
              <span className="w-2 h-px bg-zinc-700" />
            </p>
            <p className="text-[15px] font-black uppercase text-cyan-400 italic">
              {ancienClub}
            </p>
          </div>
          
          <div className="mt-5 w-full">
            <p className="text-center text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              Équipe Actuelle : <span className="text-zinc-300">{teamName}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
