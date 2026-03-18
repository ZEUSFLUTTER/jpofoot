import { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

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
        const Icon = event.type === "GOAL" ? "⚽" : event.type === "YELLOW" ? "🟨" : event.type === "RED" ? "🟥" : "🔄";

        return (
          <div key={event.id} className={cn(
            "relative flex items-center justify-between gap-4 md:gap-8",
            isTeamA ? "flex-row" : "flex-row-reverse"
          )}>
            {/* Player Info */}
            <div className={cn(
              "flex flex-1 flex-col gap-1",
              isTeamA ? "items-end text-right" : "items-start text-left"
            )}>
              <span className="text-sm font-bold text-white">
                {event.player.firstName} {event.player.lastName}
              </span>
              {event.relatedTo && (
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Assiste: {event.relatedTo.firstName} {event.relatedTo.lastName}
                </span>
              )}
              {event.type === "GOAL" && (
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter shadow-cyan-500/10">BUT!</span>
              )}
            </div>

            {/* Icon & Time */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-zinc-950 bg-zinc-800 shadow-xl group">
              <span className="text-lg transition-transform group-hover:scale-125">{Icon}</span>
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
