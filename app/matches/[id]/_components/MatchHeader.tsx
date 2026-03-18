import { MatchStatus } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MatchHeaderProps {
  match: any; // Type this properly if possible, or use the inferred type from Prisma
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const isLive = match.status === MatchStatus.LIVE;
  const isFinished = match.status === MatchStatus.FINI;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-rose-500/5" />
      
      <div className="relative flex flex-col items-center gap-8 md:flex-row md:justify-between">
        {/* Team A */}
        <div className="flex flex-1 flex-col items-center gap-4 text-center md:items-end md:text-right">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-800 p-4 shadow-inner">
            {match.teamA.logoUrl ? (
              <img src={match.teamA.logoUrl} alt={match.teamA.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-4xl font-bold text-zinc-600">{match.teamA.name[0]}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{match.teamA.name}</h2>
            <p className="text-sm text-zinc-400">Domicile</p>
          </div>
        </div>

        {/* Score / Center Info */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <span className={`text-6xl font-black tracking-tighter ${isLive ? 'text-cyan-400' : 'text-white'}`}>
              {isFinished || isLive ? match.scoreA : '-'}
            </span>
            <span className="text-3xl font-light text-zinc-600">:</span>
            <span className={`text-6xl font-black tracking-tighter ${isLive ? 'text-cyan-400' : 'text-white'}`}>
              {isFinished || isLive ? match.scoreB : '-'}
            </span>
          </div>
          
          {isLive && (
            <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1 border border-cyan-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">{match.liveMinute}'</span>
            </div>
          )}

          {isFinished && (
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Terminé</span>
          )}

          {!isFinished && !isLive && (
            <div className="text-center">
              <p className="text-lg font-medium text-cyan-300">
                {format(new Date(match.date), "HH:mm")}
              </p>
              <p className="text-xs text-zinc-500">
                {format(new Date(match.date), "EEE d MMM", { locale: fr })}
              </p>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-1 flex-col items-center gap-4 text-center md:items-start md:text-left">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-800 p-4 shadow-inner">
            {match.teamB.logoUrl ? (
              <img src={match.teamB.logoUrl} alt={match.teamB.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-4xl font-bold text-zinc-600">{match.teamB.name[0]}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{match.teamB.name}</h2>
            <p className="text-sm text-zinc-400">Extérieur</p>
          </div>
        </div>
      </div>
    </header>
  );
}
