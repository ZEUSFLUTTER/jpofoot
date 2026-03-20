import { EventType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Target, RefreshCw } from "lucide-react";

interface EventsTimelineProps {
  events: any[];
  teamAId: string;
  teamBId: string;
}

export function EventsTimeline({ events, teamAId, teamBId }: EventsTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 border-dashed">
        <p className="text-zinc-500 italic">Aucun évènement enregistré pour ce match.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:absolute before:left-1/2 before:top-0 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-zinc-800">
      {events.map((event, idx) => {
        const isTeamA = event.player.teamId === teamAId;
        
        let EventIcon = null;
        if (event.type === "GOAL") EventIcon = <Target size={16} className="text-emerald-400" />;
        else if (event.type === "YELLOW") EventIcon = <div className="h-4 w-3 rounded-sm bg-amber-400 shadow-xl border border-amber-500/50" />;
        else if (event.type === "RED") EventIcon = <div className="h-4 w-3 rounded-sm bg-rose-500 shadow-xl border border-rose-600/50" />;
        else EventIcon = <RefreshCw size={16} className="text-cyan-400" />;

        return (
          <div key={event.id} className={cn(
            "relative flex items-center justify-between gap-4 md:gap-8",
            isTeamA ? "flex-row" : "flex-row-reverse"
          )}>
            {/* Player Info */}
            <div className={cn(
              "flex flex-1 items-center gap-3",
              isTeamA ? "flex-row-reverse text-right" : "flex-row text-left"
            )}>
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 shadow-inner">
                {event.player.photoUrl ? (
                  <img src={event.player.photoUrl} alt={event.player.lastName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-zinc-700 bg-zinc-800">
                    {event.player.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col gap-1", isTeamA ? "items-end" : "items-start")}>
                <span className="text-sm font-bold text-white leading-none">
                  {event.player.firstName} {event.player.lastName}
                </span>
                {event.type === "GOAL" && (
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">BUT!</span>
                )}
                {event.relatedTo && (
                  <span className="text-[9px] text-zinc-600 uppercase font-medium">
                    Assiste: {event.relatedTo.firstName} {event.relatedTo.lastName}
                  </span>
                )}
              </div>
            </div>

            {/* Icon & Time */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-zinc-950 bg-zinc-800 shadow-xl group">
              <div className="transition-transform group-hover:scale-125 flex items-center justify-center">{EventIcon}</div>
              <span className="absolute -bottom-4 text-[10px] font-bold text-zinc-500">{event.minute}'</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        );
      })}
    </div>
  );
}
