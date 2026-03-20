"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Position } from "@/lib/formations";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  position?: string;
}

interface PitchProps {
  players: Player[];
  positions: Record<string, Position>;
  onPositionChange?: (playerId: string, pos: Position) => void;
  isEditable?: boolean;
  onClickPlayer?: (player: Player) => void;
}

export default function Pitch({ players, positions, onPositionChange, isEditable = false, onClickPlayer }: PitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  const handlePointerDown = (e: React.PointerEvent, playerId: string) => {
    if (!isEditable) return;
    e.preventDefault();
    setDraggedPlayerId(playerId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditable || !draggedPlayerId || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain within bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    onPositionChange?.(draggedPlayerId, { x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggedPlayerId(null);
  };

  return (
    <div 
      ref={pitchRef}
      className="relative aspect-[2/3] w-full max-w-md mx-auto overflow-hidden rounded-3xl border-4 border-white/10 bg-[#1a472a] shadow-2xl"
      onPointerMove={handlePointerMove}
    >
      {/* Pitch Markings */}
      <div className="absolute inset-4 border-2 border-white/20 pointer-events-none">
        {/* Center Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-white/20" />
        {/* Center Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 bg-white/40 rounded-full" />
        
        {/* Penalty Area Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/20" />
        {/* Goal Area Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-t-0 border-white/20" />
        
        {/* Penalty Area Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/20" />
        {/* Goal Area Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-b-0 border-white/20" />
      </div>

      {/* Players */}
      {(players || []).map((player) => {
        const pos = positions[player.id] || { x: 50, y: 50 };
        const isSelected = draggedPlayerId === player.id;

        return (
          <div
            key={player.id}
            onPointerDown={(e) => handlePointerDown(e, player.id)}
            onPointerUp={handlePointerUp}
            onClick={() => {
              if (!isEditable && onClickPlayer) {
                onClickPlayer(player);
              }
            }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 transition-shadow cursor-default group",
              isEditable && "cursor-grab active:cursor-grabbing hover:scale-110",
              isSelected && "z-50"
            )}
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              transition: isSelected ? 'none' : 'all 0.2s ease-out'
            }}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-zinc-900 font-black text-xs text-white shadow-xl group-hover:bg-cyan-600 transition-all overflow-hidden relative",
              isSelected && "scale-125 border-cyan-400 bg-cyan-600 ring-4 ring-cyan-500/30"
            )}>
              {(player as any).photoUrl ? (
                <>
                  <img 
                    src={(player as any).photoUrl} 
                    alt={player.lastName} 
                    className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{player.number}</span>
                </>
              ) : (
                player.number
              )}
            </div>
            <div className="mt-1 flex flex-col items-center">
              <span className="whitespace-nowrap rounded bg-zinc-900/80 px-1.5 py-0.5 text-[8px] font-black uppercase text-white shadow backdrop-blur-sm group-hover:bg-cyan-900/90">
                {player.lastName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
