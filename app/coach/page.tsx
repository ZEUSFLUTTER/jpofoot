import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoachDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("coach_session");

  if (!sessionCookie) {
    redirect("/coach/login");
  }

  const session = JSON.parse(sessionCookie.value);
  const { teamId, coachFirstName, coachLastName } = session;

  // Fetch Team & Players
  const teamSnap = await getDoc(doc(db, "teams", teamId));
  const playersSnap = await getDocs(query(
    collection(db, "players"), 
    where("teamId", "==", teamId),
    orderBy("number", "asc")
  ));

  const team = { id: teamSnap.id, ...teamSnap.data() as any };
  const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

  // Fetch Matches for this team
  const matchesSnap = await getDocs(query(
    collection(db, "matches"),
    where("teamAId", "==", teamId),
    orderBy("date", "asc")
  ));
  
  const matchesSnapB = await getDocs(query(
    collection(db, "matches"),
    where("teamBId", "==", teamId),
    orderBy("date", "asc")
  ));

  const allMatches = [...matchesSnap.docs, ...matchesSnapB.docs]
    .map(d => ({ id: d.id, ...d.data() as any }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  async function handleLogout() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("coach_session");
    redirect("/coach/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 shadow-2xl shadow-cyan-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 blur-3xl rounded-full" />
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-2 block">Portail Entraîneur</span>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              {team.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-400 font-medium capitalize">
              Coach: {coachFirstName} {coachLastName}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">Voir Public</Link>
            <form action={handleLogout}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all shadow-lg active:scale-95"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl">
           <h2 className="text-xl font-black uppercase tracking-tight text-white italic mb-6">Ajouter un Joueur</h2>
           <CoachAddPlayer teamId={teamId} />
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Gestion de l'Effectif</h2>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-bold uppercase">{players.length} Joueurs</span>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-cyan-500/30 transition-all group">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-black text-zinc-700 border border-zinc-800 group-hover:text-cyan-500 group-hover:border-cyan-500/20 transition-all">
                      #{player.number}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-100 group-hover:text-white transition-colors capitalize">{player.firstName} {player.lastName}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{player.position || "Non assigné"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl h-full">
              <h2 className="text-xl font-black uppercase tracking-tight text-white italic mb-6">Prochains Rendez-vous</h2>
              <div className="space-y-4">
                {allMatches.filter(m => m.status !== "FINI").map(match => (
                  <Link 
                    key={match.id}
                    href={`/coach/matches/${match.id}/lineup`}
                    className="block group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                      <span className="text-cyan-500 text-xs font-black uppercase italic group-hover:translate-x-1 transition-transform">Préparer →</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                       <span className={`flex-1 text-center font-bold text-sm ${match.teamAId === teamId ? "text-cyan-400" : "text-zinc-500"}`}>{match.teamAId === teamId ? "Mon Équipe" : "Adversaire"}</span>
                       <span className="text-zinc-700 font-light">vs</span>
                       <span className={`flex-1 text-center font-bold text-sm ${match.teamBId === teamId ? "text-cyan-400" : "text-zinc-500"}`}>{match.teamBId === teamId ? "Mon Équipe" : "Adversaire"}</span>
                    </div>
                  </Link>
                ))}
                {allMatches.filter(m => m.status !== "FINI").length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">Aucun match programmé</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

import { CoachAddPlayer } from "./_components/CoachAddPlayer";
