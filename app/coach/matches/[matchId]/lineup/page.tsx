"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { MatchStatus } from "@/lib/types";
import Link from "next/link";
import Pitch from "@/components/Pitch";
import { DEFAULT_POSITIONS, Position } from "@/lib/formations";

const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-3-1", "3-4-3"];

export default function LineupBuilderPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [teamDoc, setTeamDoc] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formation, setFormation] = useState("4-3-3");
  const [starting11, setStarting11] = useState<string[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/coach/matches/${matchId}/lineup-data`);
        const data = await res.json();
        if (res.ok) {
          setMatch(data.match);
          setTeamDoc(data.team);
          setPlayers(data.players);
          
          // Load existing lineup if available
          const existing = data.match.lineups?.[data.isTeamA ? 'teamA' : 'teamB'];
          if (existing) {
            setFormation(existing.formation || "4-3-3");
            setStarting11(existing.starting11 || []);
            setSubstitutes(existing.substitutes || []);
            setPositions(existing.positions || {});
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [matchId]);

  // When formation changes, we might want to reset positions
  // But only if current positions are empty or we explicitly reset
  const applyFormation = (newFormation: string) => {
    setFormation(newFormation);
    const defaults = DEFAULT_POSITIONS[newFormation];
    const newPositions: Record<string, Position> = { ...positions };
    
    starting11.forEach((id, index) => {
      if (defaults[index]) {
        newPositions[id] = defaults[index];
      }
    });
    setPositions(newPositions);
  };

  function togglePlayer(playerId: string) {
    if (starting11.includes(playerId)) {
      setStarting11(starting11.filter(id => id !== playerId));
      const newPos = { ...positions };
      delete newPos[playerId];
      setPositions(newPos);
    } else if (substitutes.includes(playerId)) {
      setSubstitutes(substitutes.filter(id => id !== playerId));
    } else {
      if (starting11.length < 11) {
        const newStarting = [...starting11, playerId];
        setStarting11(newStarting);
        
        // Give default position for the new starter
        const defaults = DEFAULT_POSITIONS[formation];
        const index = newStarting.length - 1;
        if (defaults[index]) {
          setPositions({ ...positions, [playerId]: defaults[index] });
        }
      } else if (substitutes.length < 5) {
        setSubstitutes([...substitutes, playerId]);
      }
    }
  }

  const handlePositionChange = (playerId: string, pos: Position) => {
    setPositions(prev => ({ ...prev, [playerId]: pos }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/coach/matches/${matchId}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation, starting11, substitutes, positions }),
      });
      if (res.ok) {
        router.push("/coach");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const starterPlayers = useMemo(() => {
    return players.filter(p => starting11.includes(p.id));
  }, [players, starting11]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-500 font-black uppercase tracking-widest">Chargement...</div>;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <Link href="/coach" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">← Retour</Link>
          <h1 className="text-2xl font-black uppercase italic text-white tracking-tight">Composition du Match</h1>
          <button 
            disabled={saving || starting11.length === 0}
            onClick={handleSave}
            className="rounded-xl bg-cyan-600 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Rules & Selection */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl">
              <h2 className="text-lg font-black uppercase italic text-zinc-100 mb-4">Système de Jeu</h2>
              <div className="grid grid-cols-3 gap-2">
                {FORMATIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => applyFormation(f)}
                    className={`rounded-xl border p-3 text-xs font-black uppercase transition-all ${formation === f ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl">
              <h2 className="text-lg font-black uppercase italic text-zinc-100 mb-4">Joueurs ({players.length})</h2>
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 thin-scrollbar">
                {players.map(player => {
                  const isStarter = starting11.includes(player.id);
                  const isSub = substitutes.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all ${isStarter ? 'border-emerald-500 bg-emerald-500/10' : isSub ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-500">#{player.number}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-zinc-100">{player.firstName} {player.lastName}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-black">{player.position || "Joueur"}</p>
                        </div>
                      </div>
                      {isStarter && <span className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded font-black uppercase tracking-widest">Titulaire</span>}
                      {isSub && <span className="text-[10px] bg-amber-500 text-white px-2 py-1 rounded font-black uppercase tracking-widest">Banc</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white tracking-tight">Disposition</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Glissez les joueurs pour les placer</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">{formation}</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <Pitch 
                  players={starterPlayers} 
                  positions={positions} 
                  onPositionChange={handlePositionChange}
                  isEditable={true} 
                />
              </div>

              <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600 relative z-10">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                   Titulaires ({starting11.length}/11)
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-amber-500" />
                   Remplaçants ({substitutes.length}/5)
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

