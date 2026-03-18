import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  const [teams, matches, stats] = await Promise.all([
    prisma.team.findMany({
      include: {
        players: {
          orderBy: [{ number: "asc" }, { lastName: "asc" }],
          include: { stats: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.match.findMany({
      include: {
        teamA: true,
        teamB: true,
        events: {
          include: { player: true, relatedTo: true },
          orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.playerStat.findMany({
      include: {
        player: {
          include: {
            team: true,
          },
        },
      },
    }),
  ]);

  const standings = computeStandings(matches);

  const topScorers = [...stats]
    .filter((entry) => entry.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 10);

  const topAssists = [...stats]
    .filter((entry) => entry.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, 10);

  const discipline = [...stats]
    .filter((entry) => entry.yellowCards > 0 || entry.redCards > 0)
    .sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards)
    .slice(0, 10);

  const liveMatches = matches.filter((match) => match.status === MatchStatus.LIVE);
  const upcomingMatches = matches.filter((match) => match.status === MatchStatus.PREVU);
  const finishedMatches = matches.filter((match) => match.status === MatchStatus.FINI);

  return {
    teams,
    allMatches: matches,
    standings,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    topScorers,
    topAssists,
    discipline,
  };
}

export async function getMatchById(id: string) {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      teamA: {
        include: {
          players: {
            include: { stats: true },
            orderBy: [{ number: "asc" }, { lastName: "asc" }],
          },
        },
      },
      teamB: {
        include: {
          players: {
            include: { stats: true },
            orderBy: [{ number: "asc" }, { lastName: "asc" }],
          },
        },
      },
      events: {
        include: { player: true, relatedTo: true },
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!match) return null;

  // Fetch H2H and Form
  const [h2hMatches, teamAForm, teamBForm] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [
          { teamAId: match.teamAId, teamBId: match.teamBId },
          { teamAId: match.teamBId, teamBId: match.teamAId },
        ],
        status: MatchStatus.FINI,
      },
      orderBy: { date: "desc" },
      take: 5,
      include: { teamA: true, teamB: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [{ teamAId: match.teamAId }, { teamBId: match.teamAId }],
        status: MatchStatus.FINI,
      },
      orderBy: { date: "desc" },
      take: 5,
      include: { teamA: true, teamB: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [{ teamAId: match.teamBId }, { teamBId: match.teamBId }],
        status: MatchStatus.FINI,
      },
      orderBy: { date: "desc" },
      take: 5,
      include: { teamA: true, teamB: true },
    }),
  ]);

  return {
    match,
    h2hMatches,
    teamAForm,
    teamBForm,
  };
}

function computeStandings(
  matches: Array<{
    teamAId: string;
    teamBId: string;
    teamA: { name: string };
    teamB: { name: string };
    scoreA: number;
    scoreB: number;
    status: MatchStatus;
  }>,
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
