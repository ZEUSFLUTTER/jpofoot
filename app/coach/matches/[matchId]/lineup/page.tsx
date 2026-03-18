"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MatchStatus } from "@/lib/types";

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

  function togglePlayer(playerId: string) {
    if (starting11.includes(playerId)) {
      setStarting11(starting11.filter(id => id !== playerId));
    } else if (substitutes.includes(playerId)) {
      setSubstitutes(substitutes.filter(id => id !== playerId));
    } else {
      if (starting11.length < 11) {
        setStarting11([...starting11, playerId]);
      } else if (substitutes.length < 5) {
        setSubstitutes([...substitutes, playerId]);
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/coach/matches/${matchId}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation, starting11, substitutes }),
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

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-500 font-black uppercase tracking-widest">Chargement...</div>;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <Link href="/coach" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">← Retour Tableau</Link>
          <h1 className="text-2xl font-black uppercase italic text-white tracking-tight">Composition du Match</h1>
          <button 
            disabled={saving || starting11.length === 0}
            onClick={handleSave}
            className="rounded-xl bg-cyan-600 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          {/* Rules & Formation */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl">
              <h2 className="text-lg font-black uppercase italic text-zinc-100 mb-4">Système de Jeu</h2>
              <div className="grid grid-cols-3 gap-2">
                {FORMATIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormation(f)}
                    className={`rounded-xl border p-3 text-xs font-black uppercase transition-all ${formation === f ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl">
              <h2 className="text-lg font-black uppercase italic text-zinc-100 mb-4">Règles de Composition</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Titulaires (11 max)</span>
                  <span className={`font-black ${starting11.length === 11 ? 'text-emerald-400' : 'text-cyan-400'}`}>{starting11.length}/11</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Remplaçants (5 max)</span>
                  <span className={`font-black ${substitutes.length === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>{substitutes.length}/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl">
            <h2 className="text-lg font-black uppercase italic text-zinc-100 mb-4">Sélection des Joueurs</h2>
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
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
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
