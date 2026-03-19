import { Shield, Video } from "lucide-react";
import { MatchStatus } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MatchHeaderProps {
  match: any;
  onViewCompo?: () => void;
}

export function MatchHeader({ match, onViewCompo }: MatchHeaderProps) {
  const isLive = match.status === MatchStatus.LIVE;
  const isFinished = match.status === MatchStatus.FINI;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-rose-500/5" />
      
      <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        {/* Team A */}
        <div className="flex flex-1 flex-col items-center gap-4 text-center md:items-end md:text-right">
          <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-zinc-800 p-4 shadow-inner">
            {match.teamA.logoUrl ? (
              <img src={match.teamA.logoUrl} alt={match.teamA.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-zinc-600">{match.teamA.name[0]}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">{match.teamA.name}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Domicile</p>
          </div>
        </div>

        {/* Score / Center Info */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <span className={`text-5xl md:text-7xl font-black tracking-tighter tabular-nums ${isLive ? 'text-cyan-400' : 'text-zinc-100'}`}>
              {isFinished || isLive ? match.scoreA : '-'}
            </span>
            <div className="flex flex-col items-center gap-1">
               <span className="text-2xl font-light text-zinc-700">VS</span>
               {isLive && (
                 <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
                   <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{match.liveMinute}'</span>
                 </div>
               )}
            </div>
            <span className={`text-5xl md:text-7xl font-black tracking-tighter tabular-nums ${isLive ? 'text-cyan-400' : 'text-zinc-100'}`}>
              {isFinished || isLive ? match.scoreB : '-'}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-2 items-center">
              {onViewCompo && (
                <button 
                  onClick={onViewCompo}
                  className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-800 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 hover:text-white hover:bg-zinc-900 transition-all active:scale-95 group shadow-xl w-full justify-center"
                >
                  <Shield size={14} className="group-hover:rotate-12 transition-transform" />
                  Voir Compositions
                </button>
              )}

              {isLive && match.meetUrl && (
                <a 
                  href={match.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-500 transition-all active:scale-95 group shadow-xl shadow-emerald-600/20 animate-pulse w-full justify-center"
                >
                  <Video size={14} className="group-hover:scale-110 transition-transform" />
                  Regarder en direct
                </a>
              )}
            </div>

            {!isFinished && !isLive && (
              <div className="text-center">
                <p suppressHydrationWarning className="text-sm font-black text-white uppercase tracking-widest">
                  {format(new Date(match.date), "EEE d MMM", { locale: fr })}
                </p>
                <p suppressHydrationWarning className="text-xl font-black text-cyan-400 mt-1 tabular-nums">
                  {format(new Date(match.date), "HH:mm")}
                </p>
              </div>
            )}

            {isFinished && (
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] border border-zinc-800 px-3 py-1 rounded-lg">Terminé</span>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-1 flex-col items-center gap-4 text-center md:items-start md:text-left">
          <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-zinc-800 p-4 shadow-inner">
            {match.teamB.logoUrl ? (
              <img src={match.teamB.logoUrl} alt={match.teamB.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-zinc-600">{match.teamB.name[0]}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">{match.teamB.name}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Extérieur</p>
          </div>
        </div>
      </div>
    </header>
  );
}
