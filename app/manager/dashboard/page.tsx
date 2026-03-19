import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { ManagerControlRoom } from "./_components/manager-control-room";
import { ShieldCheck, Calendar, ArrowRight, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ matchId?: string }>;
};

export default async function ManagerDashboard({ searchParams }: Props) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("manager_session");

  if (!sessionCookie) redirect("/manager/login");

  let session: any;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect("/manager/login");
  }

  const { assignedMatchIds, firstName } = session;
  const { matchId: selectedMatchId } = await searchParams;

  if (!assignedMatchIds || assignedMatchIds.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 border border-zinc-800 shadow-2xl">
           <span className="text-4xl font-bold">!</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase text-white tracking-tighter italic">Aucun Match Assigné</h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">Veuillez contacter l'administrateur pour qu'un match vous soit attribué sur votre compte "{firstName}".</p>
        </div>
        <form action={async () => {
          "use server";
          const cs = await cookies();
          cs.delete("manager_session");
          redirect("/manager/login");
        }}>
          <button className="text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-white transition-colors">Déconnexion</button>
        </form>
      </main>
    );
  }

  // If no match selected and multiple exist, show selection screen
  if (!selectedMatchId && assignedMatchIds.length > 1) {
    const matchesSnap = await Promise.all(
      assignedMatchIds.map((id: string) => getDoc(doc(db, "matches", id)))
    );

    const assignedMatches = matchesSnap
      .filter(s => s.exists())
      .map(s => {
        const d = s.data() as any;
        return { id: s.id, ...d };
      });

    // Fetch team names for display
    const teamIds = Array.from(new Set(assignedMatches.flatMap(m => [m.teamAId, m.teamBId])));
    const teamsSnap = await Promise.all(teamIds.map(id => getDoc(doc(db, "teams", id))));
    const teamsMap = Object.fromEntries(teamsSnap.map(s => [s.id, s.data()?.name]));

    return (
      <main className="min-h-screen bg-zinc-950 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex justify-between items-center bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800 backdrop-blur-md">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">Bonjour, {firstName}</h1>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sélectionnez le match à piloter</p>
                </div>
             </div>
             <form action={async () => {
                "use server";
                const cs = await cookies();
                cs.delete("manager_session");
                redirect("/manager/login");
              }}>
                <button className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white transition-all">
                   <LogOut size={18} />
                </button>
             </form>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {assignedMatches.map(m => (
               <a 
                 key={m.id} 
                 href={`/manager/dashboard?matchId=${m.id}`}
                 className="group p-8 rounded-[40px] bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800/50 transition-all space-y-6 relative overflow-hidden shadow-xl"
               >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                     <ArrowRight size={24} className="text-cyan-500" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Calendar size={14} className="text-zinc-500" />
                     <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{new Date(m.date).toLocaleDateString()} - {m.title}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                     <div className="text-center flex-1">
                        <p className="text-xs font-black uppercase text-white line-clamp-1">{teamsMap[m.teamAId]}</p>
                     </div>
                     <span className="text-[10px] font-black text-zinc-700 italic">VS</span>
                     <div className="text-center flex-1">
                        <p className="text-xs font-black uppercase text-white line-clamp-1">{teamsMap[m.teamBId]}</p>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">{m.status}</span>
                     <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">{m.scoreA} - {m.scoreB}</span>
                  </div>
               </a>
             ))}
          </div>
        </div>
      </main>
    );
  }

  // Use the only assigned match or the selected one
  const targetMatchId = selectedMatchId || assignedMatchIds[0];

  // Fetch Match Data
  const matchSnap = await getDoc(doc(db, "matches", targetMatchId));
  if (!matchSnap.exists()) {
    redirect("/manager/dashboard"); // Reset if invalid
  }

  const matchData = matchSnap.data() as any;
  
  // Fetch Teams & Events
  const [teamASnap, teamBSnap, eventsSnap] = await Promise.all([
    getDoc(doc(db, "teams", matchData.teamAId)),
    getDoc(doc(db, "teams", matchData.teamBId)),
    getDocs(query(collection(db, "matches", targetMatchId, "events"), orderBy("createdAt", "desc")))
  ]);

  const teamA = { id: teamASnap.id, ...(teamASnap.data() as any) };
  const teamB = { id: teamBSnap.id, ...(teamBSnap.data() as any) };

  // Fetch Players for both teams
  const [playersASnap, playersBSnap] = await Promise.all([
     getDocs(query(collection(db, "players"), where("teamId", "==", matchData.teamAId))),
     getDocs(query(collection(db, "players"), where("teamId", "==", matchData.teamBId)))
  ]);

  const allPlayers = [
    ...playersASnap.docs.map(d => ({ id: d.id, ...d.data() as any })),
    ...playersBSnap.docs.map(d => ({ id: d.id, ...d.data() as any }))
  ];

  const match = {
    id: matchSnap.id,
    ...matchData,
    teamA,
    teamB,
    events: eventsSnap.docs.map(d => {
       const e = d.data();
       const player = allPlayers.find(p => p.id === e.playerId);
       return { id: d.id, ...e, player };
    })
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <ManagerControlRoom 
        match={match} 
        players={allPlayers}
        managerName={firstName}
        showBackButton={assignedMatchIds.length > 1}
      />
    </div>
  );
}
