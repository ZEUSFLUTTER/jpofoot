"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MatchHeader } from "./_components/MatchHeader";
import { MatchTabs, MatchTab } from "./_components/MatchTabs";
import { EventsTimeline } from "./_components/EventsTimeline";
import { MatchStats } from "./_components/MatchStats";
import { PreMatchInfo } from "./_components/PreMatchInfo";
import { Lineups } from "./_components/Lineups";
import { MatchStatus } from "@/lib/types";
import Link from "next/link";

const LIVE_POLL_INTERVAL = 15000; // 15 seconds

export default function MatchDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MatchTab>("analyse");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchMatch(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.match) {
        setData(json);
        setLastUpdated(new Date());
        if (!silent) {
          // Only set the default tab on first load
          if (json.match.status === MatchStatus.FINI || json.match.status === MatchStatus.LIVE) {
            setActiveTab("events");
          } else {
            setActiveTab("analyse");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch match", err);
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMatch(false);
  }, [id]);

  // Auto-polling for live matches
  useEffect(() => {
    if (!data?.match) return;
    if (data.match.status !== MatchStatus.LIVE) return;

    const interval = setInterval(() => {
      fetchMatch(true);
    }, LIVE_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [data?.match?.status, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-50">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-zinc-800 border-t-cyan-500" />
          <span className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">IAI</span>
        </div>
      </div>
    );
  }

  if (!data || !data.match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-rose-500">Match Introuvable</h1>
        <Link href="/" className="text-zinc-500 hover:text-cyan-400 underline underline-offset-4 transition-colors">Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const { match, h2hMatches, teamAForm, teamBForm } = data;
  const showLiveTabs = match.status !== MatchStatus.PREVU;
  const isLive = match.status === MatchStatus.LIVE;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10 selection:bg-cyan-500/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">

        <div className="flex items-center justify-between">
          <Link href="/" className="group flex w-fit items-center gap-2 text-sm font-bold text-zinc-500 hover:text-cyan-400 transition-all uppercase tracking-widest">
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Tableau de Bord
          </Link>
          
          {/* Live indicator & last refresh time */}
          {isLive && (
            <div className="flex items-center gap-3">
              {isRefreshing && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-500" />
              )}
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Live · Auto-refresh
                </span>
              </div>
              {lastUpdated && (
                <span className="text-[10px] text-zinc-600 font-medium">
                  Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>
          )}
        </div>

        <MatchHeader match={match} onViewCompo={() => setActiveTab("compos")} />

        <div className="sticky top-4 z-40 bg-zinc-950/80 pt-2 backdrop-blur-md">
          <MatchTabs
            currentTab={activeTab}
            onTabChange={setActiveTab}
            showLiveTabs={showLiveTabs}
          />
        </div>

        <div className="min-h-[400px]">
          {activeTab === "analyse" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 blur-3xl rounded-full" />
                <h3 className="mb-4 text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-cyan-400 transition-colors">Aperçu du Match</h3>
                <p className="text-zinc-400 leading-relaxed font-medium">
                  Bienvenue dans le centre de match. Ce duel entre <span className="text-cyan-400 font-black">{match.teamA.name}</span> et <span className="text-rose-400 font-black">{match.teamB.name}</span> s&apos;annonce électrique.
                  Consultez les statistiques, la forme des équipes et les évènements en direct pour ne rien manquer.
                </p>
              </section>
              <PreMatchInfo match={match} h2hMatches={h2hMatches} teamAForm={teamAForm} teamBForm={teamBForm} />
            </div>
          )}

          {activeTab === "events" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto py-12">
              <EventsTimeline events={match.events} teamAId={match.teamAId} teamBId={match.teamBId} />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
              <MatchStats match={match} />
            </div>
          )}

          {activeTab === "compos" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Lineups teamA={match.teamA} teamB={match.teamB} match={match} />
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-600 font-bold uppercase tracking-[0.2em] border-t border-zinc-900 pt-8">
          inter filiere IAI &copy; 2026
        </footer>
      </div>
    </main>
  );
}
