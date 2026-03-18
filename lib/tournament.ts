import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc,
  Timestamp,
  limit
} from "firebase/firestore";
import { MatchStatus } from "@/lib/types";

export type StandingRow = {
  teamId: string;
  teamName: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
};

type H2HMap = Map<string, number>;

const getPairKey = (left: string, right: string) => [left, right].sort().join("|");

export async function getDashboardData() {
  try {
    const [teamsSnap, matchesSnap] = await Promise.all([
      getDocs(query(collection(db, "teams"), orderBy("name", "asc"))),
      getDocs(query(collection(db, "matches"), orderBy("date", "asc")))
    ]);

    const teams = await Promise.all(teamsSnap.docs.map(async (teamDoc) => {
      const data = teamDoc.data();
      // REMOVED orderBy to avoid composite index requirement
      const playersSnap = await getDocs(query(
        collection(db, "players"), 
        where("teamId", "==", teamDoc.id)
      ));
      
      const players = playersSnap.docs.map(p => {
        const pData = p.data();
        return {
          id: p.id,
          firstName: pData.firstName || "",
          lastName: pData.lastName || "",
          number: pData.number || 0,
          teamId: pData.teamId || "",
          position: pData.position || null,
          photoUrl: pData.photoUrl || null,
          stats: pData.stats || null
        };
      }).sort((a, b) => a.number - b.number); // Sort in-memory

      return {
        id: teamDoc.id,
        name: data.name || "",
        logoUrl: data.logoUrl || null,
        colors: data.colors || null,
        coachFirstName: data.coachFirstName || "",
        coachLastName: data.coachLastName || "",
        players
      };
    }));

  const allMatches = matchesSnap.docs.map(m => {
    const data = m.data();
    return {
      id: m.id,
      ...data,
      date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
      // We'll need to fetch team names or join them if needed, 
      // but for dashboard we usually have team names stored or fetch them
    };
  });

  // Hydrate matches with team names for the dashboard
  const hydratedMatches = allMatches.map(match => {
    const data = match as any;
    const teamA = teams.find(t => t.id === data.teamAId);
    const teamB = teams.find(t => t.id === data.teamBId);
    
    // Ensure date is valid
    let matchDate = data.date;
    if (!(matchDate instanceof Date) || isNaN(matchDate.getTime())) {
      matchDate = new Date();
    }

    return {
      id: data.id,
      teamAId: data.teamAId || "unknown-a",
      teamBId: data.teamBId || "unknown-b",
      scoreA: data.scoreA ?? 0,
      scoreB: data.scoreB ?? 0,
      status: data.status || MatchStatus.PREVU,
      liveMinute: data.liveMinute || 0,
      date: matchDate,
      teamA: { id: teamA?.id || data.teamAId, name: teamA?.name || "Équipe A" },
      teamB: { id: teamB?.id || data.teamBId, name: teamB?.name || "Équipe B" },
      events: [] as any[]
    };
  });

  const standings = computeStandings(hydratedMatches);

  // Stats are calculated from players' stats field in our proposed schema
  const playersWithStats: any[] = [];
  teams.forEach(t => {
    t.players.forEach((p: any) => {
      if (p.stats && (p.stats.goals > 0 || p.stats.assists > 0 || p.stats.yellowCards > 0 || p.stats.redCards > 0)) {
        playersWithStats.push({
          ...p,
          team: { name: t.name }
        });
      }
    });
  });

  const topScorers = [...playersWithStats]
    .filter((p) => p.stats.goals > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists)
    .slice(0, 10)
    .map(p => ({ playerId: p.id, player: p, goals: p.stats.goals }));

  const topAssists = [...playersWithStats]
    .filter((p) => p.stats.assists > 0)
    .sort((a, b) => b.stats.assists - a.stats.assists || b.stats.goals - a.stats.goals)
    .slice(0, 10)
    .map(p => ({ playerId: p.id, player: p, assists: p.stats.assists }));

  const discipline = [...playersWithStats]
    .filter((p) => p.stats.yellowCards > 0 || p.stats.redCards > 0)
    .sort((a, b) => b.stats.redCards - a.stats.redCards || b.stats.yellowCards - a.stats.yellowCards)
    .slice(0, 10)
    .map(p => ({ playerId: p.id, player: p, yellowCards: p.stats.yellowCards, redCards: p.stats.redCards }));

  const liveMatches = hydratedMatches.filter((match) => match.status === MatchStatus.LIVE);
  const upcomingMatches = hydratedMatches.filter((match) => match.status === MatchStatus.PREVU);
  const finishedMatches = hydratedMatches.filter((match) => match.status === MatchStatus.FINI);

    return {
      teams,
      allMatches: hydratedMatches,
      standings,
      liveMatches,
      upcomingMatches,
      finishedMatches,
      topScorers,
      topAssists,
      discipline,
    };
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    return {
      teams: [],
      allMatches: [],
      standings: [],
      liveMatches: [],
      upcomingMatches: [],
      finishedMatches: [],
      topScorers: [],
      topAssists: [],
      discipline: [],
    };
  }
}

export async function getMatchById(id: string) {
  try {
    const matchDoc = await getDoc(doc(db, "matches", id));
    if (!matchDoc.exists()) return null;

    const matchData = matchDoc.data() as any;
    const [teamASnap, teamBSnap, eventsSnap] = await Promise.all([
      getDoc(doc(db, "teams", matchData.teamAId || "unknown")),
      getDoc(doc(db, "teams", matchData.teamBId || "unknown")),
      getDocs(query(collection(db, "matches", id, "events"), orderBy("minute", "asc")))
    ]);

    const fetchPlayers = async (teamId: string) => {
      if (!teamId) return [];
      try {
        // REMOVED orderBy to avoid composite index requirement
        const snap = await getDocs(query(collection(db, "players"), where("teamId", "==", teamId)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() as any }))
          .sort((a, b) => a.number - b.number); // Sort in-memory
      } catch (e) {
        console.error(`Error fetching players for team ${teamId}:`, e);
        return [];
      }
    };

    const [teamAPlayers, teamBPlayers] = await Promise.all([
      fetchPlayers(matchData.teamAId),
      fetchPlayers(matchData.teamBId)
    ]);

    let matchDate = matchData.date;
    if (matchDate instanceof Timestamp) {
      matchDate = matchDate.toDate();
    } else {
      matchDate = new Date(matchDate);
      if (isNaN(matchDate.getTime())) matchDate = new Date();
    }

    const match = {
      id: matchDoc.id,
      teamAId: matchData.teamAId || "unknown-a",
      teamBId: matchData.teamBId || "unknown-b",
      scoreA: matchData.scoreA ?? 0,
      scoreB: matchData.scoreB ?? 0,
      status: matchData.status || MatchStatus.PREVU,
      liveMinute: matchData.liveMinute || 0,
      date: matchDate,
      teamA: { 
        id: teamASnap.id, 
        name: (teamASnap.data() as any)?.name || "Équipe A", 
        ...(teamASnap.data() || {}),
        players: teamAPlayers 
      },
      teamB: { 
        id: teamBSnap.id, 
        name: (teamBSnap.data() as any)?.name || "Équipe B", 
        ...(teamBSnap.data() || {}),
        players: teamBPlayers 
      },
      events: eventsSnap.docs.map(d => {
        const eData = d.data() as any;
        const player = [...teamAPlayers, ...teamBPlayers].find(p => p.id === eData.playerId);
        return { id: d.id, ...eData, player: player || { firstName: "Joueur", lastName: "Inconnu", teamId: eData.teamId } };
      })
    };

    // Fetch all finished matches — simple where only, no orderBy (avoids composite index)
    let finishedMatchesDocs: any[] = [];
    try {
      const finishedSnap = await getDocs(query(
        collection(db, "matches"),
        where("status", "==", MatchStatus.FINI)
      ));
      finishedMatchesDocs = finishedSnap.docs;
    } catch (e) {
      console.warn("Could not fetch finished matches for H2H/form:", e);
    }

    // Sort in-memory by date desc
    finishedMatchesDocs.sort((a, b) => {
      const dA = a.data().date?.toDate ? a.data().date.toDate().getTime() : new Date(a.data().date).getTime();
      const dB = b.data().date?.toDate ? b.data().date.toDate().getTime() : new Date(b.data().date).getTime();
      return dB - dA;
    });

    const h2hMatches = finishedMatchesDocs
      .filter(d => {
        const dData = d.data();
        return (dData.teamAId === match.teamAId && dData.teamBId === match.teamBId)
          || (dData.teamAId === match.teamBId && dData.teamBId === match.teamAId);
      })
      .slice(0, 5)
      .map(d => ({ id: d.id, ...d.data() }));

    const filterForm = (docs: any[], teamId: string) =>
      docs
        .filter(d => d.data().teamAId === teamId || d.data().teamBId === teamId)
        .slice(0, 5)
        .map(d => ({ id: d.id, ...d.data() }));

    return {
      match,
      h2hMatches,
      teamAForm: filterForm(finishedMatchesDocs, match.teamAId),
      teamBForm: filterForm(finishedMatchesDocs, match.teamBId),
    };
  } catch (error) {
    console.error(`Error in getMatchById for match ${id}:`, error);
    return null;
  }
}

function computeStandings(
  matches: any[]
) {
  const rows = new Map<string, StandingRow>();
  const h2hMap: H2HMap = new Map();

  for (const match of matches) {
    if (match.status !== MatchStatus.FINI) {
      continue;
    }

    ensureRow(rows, match.teamAId, match.teamA.name);
    ensureRow(rows, match.teamBId, match.teamB.name);

    const teamA = rows.get(match.teamAId)!;
    const teamB = rows.get(match.teamBId)!;

    teamA.played += 1;
    teamB.played += 1;
    teamA.goalsFor += match.scoreA;
    teamA.goalsAgainst += match.scoreB;
    teamB.goalsFor += match.scoreB;
    teamB.goalsAgainst += match.scoreA;

    const pairKey = getPairKey(match.teamAId, match.teamBId);

    if (match.scoreA > match.scoreB) {
      teamA.wins += 1;
      teamB.losses += 1;
      teamA.points += 3;
      h2hMap.set(`${pairKey}:${match.teamAId}`, (h2hMap.get(`${pairKey}:${match.teamAId}`) ?? 0) + 3);
    } else if (match.scoreA < match.scoreB) {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 3;
      h2hMap.set(`${pairKey}:${match.teamBId}`, (h2hMap.get(`${pairKey}:${match.teamBId}`) ?? 0) + 3);
    } else {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
      h2hMap.set(`${pairKey}:${match.teamAId}`, (h2hMap.get(`${pairKey}:${match.teamAId}`) ?? 0) + 1);
      h2hMap.set(`${pairKey}:${match.teamBId}`, (h2hMap.get(`${pairKey}:${match.teamBId}`) ?? 0) + 1);
    }
  }

  return [...rows.values()]
    .map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      if (right.goalDiff !== left.goalDiff) {
        return right.goalDiff - left.goalDiff;
      }
      if (right.goalsFor !== left.goalsFor) {
        return right.goalsFor - left.goalsFor;
      }
      const pairKey = getPairKey(left.teamId, right.teamId);
      const leftH2H = h2hMap.get(`${pairKey}:${left.teamId}`) ?? 0;
      const rightH2H = h2hMap.get(`${pairKey}:${right.teamId}`) ?? 0;
      if (rightH2H !== leftH2H) {
        return rightH2H - leftH2H;
      }
      return left.teamName.localeCompare(right.teamName);
    });
}

function ensureRow(rows: Map<string, StandingRow>, teamId: string, teamName: string) {
  if (!rows.has(teamId)) {
    rows.set(teamId, {
      teamId,
      teamName,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    });
  }
}
