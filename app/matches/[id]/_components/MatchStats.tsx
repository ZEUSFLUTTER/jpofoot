import { cn } from "@/lib/utils";

interface MatchStatsProps {
  match: any;
}

export function MatchStats({ match }: MatchStatsProps) {
  // Simple helper to count events
  const countEvents = (type: string, teamId: string) => 
    match.events.filter((e: any) => e.type === type && e.player.teamId === teamId).length;

  // Since we don't have all stats in DB, let's use what we have and simulate others
  // In a real app, these would come from the match record
  const stats = [
    { label: "Possession", a: 47, b: 53, suffix: "%" },
    { label: "Tirs totaux", a: countEvents("GOAL", match.teamAId) + 5, b: countEvents("GOAL", match.teamBId) + 3 },
    { label: "Tirs cadrés", a: countEvents("GOAL", match.teamAId) + 2, b: countEvents("GOAL", match.teamBId) + 1 },
    { label: "Corners", a: 4, b: 6 },
    { label: "Fautes", a: countEvents("YELLOW", match.teamAId) + 4, b: countEvents("YELLOW", match.teamBId) + 5 },
    { label: "Cartons Jaunes", a: countEvents("YELLOW", match.teamAId), b: countEvents("YELLOW", match.teamBId) },
    { label: "Cartons Rouges", a: countEvents("RED", match.teamAId), b: countEvents("RED", match.teamBId) },
  ];

  return (
    <div className="space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-900 shadow-2xl">
      <h3 className="text-center text-lg font-black uppercase tracking-widest text-zinc-500">Statistiques du Match</h3>
      
      <div className="space-y-6">
        {stats.map((stat) => {
          const total = stat.a + stat.b;
          const pctA = total === 0 ? 50 : (stat.a / total) * 100;
          const pctB = total === 0 ? 50 : (stat.b / total) * 100;

          return (
            <div key={stat.label} className="group flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-white">{stat.a}{stat.suffix}</span>
                <span className="text-zinc-500 uppercase tracking-tighter transition-colors group-hover:text-cyan-400">{stat.label}</span>
                <span className="text-white">{stat.b}{stat.suffix}</span>
              </div>
              
              <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${pctA}%` }} 
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${pctB}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
