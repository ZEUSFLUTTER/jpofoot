import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { CoachAddPlayer } from "./_components/CoachAddPlayer";
import { CoachPlayersList } from "./_components/CoachPlayersList";
import { CoachEditTeam } from "./_components/CoachEditTeam";
import { LogOut, Eye, User, Calendar, Plus, Users, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

async function handleLogout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("coach_session");
  redirect("/coach/login");
}

export default async function CoachDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("coach_session");

  if (!sessionCookie) {
    redirect("/coach/login");
  }

  let session: any;
  try {
    session = JSON.parse(sessionCookie!.value);
  } catch {
    redirect("/coach/login");
  }

  const { teamId, coachFirstName, coachLastName } = session;

  try {
    // Fetch Team
    const teamSnap = await getDoc(doc(db, "teams", teamId));

    if (!teamSnap.exists()) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-rose-500 font-bold uppercase tracking-widest">
          Équipe introuvable. Veuillez contacter l&apos;administrateur.
        </div>
      );
    }

    const team = { id: teamSnap.id, ...teamSnap.data() as any };

    // Fetch Players
    const playersSnap = await getDocs(
      query(collection(db, "players"), where("teamId", "==", teamId))
    );
    const players = playersSnap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .sort((a, b) => (a.number || 0) - (b.number || 0));

    // Fetch Matches
    const [matchesSnapA, matchesSnapB] = await Promise.all([
      getDocs(query(collection(db, "matches"), where("teamAId", "==", teamId))),
      getDocs(query(collection(db, "matches"), where("teamBId", "==", teamId))),
    ]);

    const allMatches = [...matchesSnapA.docs, ...matchesSnapB.docs]
      .map(d => ({ id: d.id, ...d.data() as any }))
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return dateA - dateB;
      });

    const upcomingMatches = allMatches.filter(m => m.status !== "FINI");

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
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400 font-medium capitalize">
                <User size={14} className="text-cyan-500" />
                Coach: {coachFirstName} {coachLastName}
              </div>
              <CoachEditTeam team={team} />
            </div>

            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <Link href="/" className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                <Eye size={14} />
                Voir Public
              </Link>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all shadow-lg active:scale-95"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </form>
            </div>
          </header>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Plus size={20} className="text-cyan-500" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Ajouter un Joueur</h2>
            </div>
            <CoachAddPlayer teamId={teamId} players={players} />
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2 space-y-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl">
                 <div className="flex items-center gap-3 mb-6">
                   <Users size={20} className="text-cyan-500" />
                   <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Gestion de l'Effectif</h2>
                 </div>
                <CoachPlayersList players={players} />
              </div>
            </section>

            <section className="space-y-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar size={20} className="text-cyan-500" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Prochains Matchs</h2>
                </div>
                <div className="space-y-4">
                  {upcomingMatches.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">Aucun match programmé</p>
                    </div>
                  ) : (
                    upcomingMatches.map(match => {
                      const dateStr = match.date?.toDate
                        ? match.date.toDate().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })
                        : new Date(match.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
                      return (
                        <Link
                          key={match.id}
                          href={`/coach/matches/${match.id}/lineup`}
                          className="block group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-cyan-500/50 hover:bg-zinc-900"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{dateStr}</span>
                            <span className="text-cyan-500 text-xs font-black uppercase italic group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              Préparer <Trophy size={10} />
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-4">
                            <span className={`flex-1 text-center font-bold text-sm ${match.teamAId === teamId ? "text-cyan-400" : "text-zinc-500"}`}>
                              {match.teamAId === teamId ? "Mon Équipe" : "Adversaire"}
                            </span>
                            <span className="text-zinc-700 font-light">vs</span>
                            <span className={`flex-1 text-center font-bold text-sm ${match.teamBId === teamId ? "text-cyan-400" : "text-zinc-500"}`}>
                              {match.teamBId === teamId ? "Mon Équipe" : "Adversaire"}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("CoachDashboard Error:", error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white gap-6 px-4">
        <h1 className="text-xl font-black text-rose-500 uppercase tracking-widest text-center">Erreur de chargement</h1>
        <p className="text-sm text-zinc-500 text-center">Une erreur est survenue. Veuillez vous déconnecter et réessayer.</p>
        <form action={handleLogout}>
          <button type="submit" className="rounded-xl bg-zinc-900 border border-zinc-800 px-6 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }
}
