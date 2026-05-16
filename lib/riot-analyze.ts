import { combos, comboId, scoreTheorique, comboIdsSuivis } from "@/lib/combos";

type RiotAccount = { puuid: string; gameName: string; tagLine: string };

type Participant = {
  puuid: string;
  championName: string;
  teamId: number;
  teamPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  visionScore: number;
  neutralMinionsKilled?: number;
  totalMinionsKilled?: number;
};

type RiotMatch = {
  metadata: { matchId: string };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    gameVersion: string;
    participants: Participant[];
  };
};

export type AnalyseDuoInput = {
  adcName: string;
  adcTag: string;
  suppName: string;
  suppTag: string;
  count?: number;
  rangeMode?: "recent" | "season2026";
  queueFilter?: "all" | "ranked_solo" | "ranked_flex" | "normal_draft" | "normal_blind";
};

const REGION = "europe";
const BASE = `https://${REGION}.api.riotgames.com`;
const DEBUT_SAISON_2026 = Math.floor(new Date("2026-01-08T00:00:00Z").getTime() / 1000);
const MAX_MATCHS_SAISON = 500;

const QUEUES: Record<string, number | null> = {
  all: null,
  ranked_solo: 420,
  ranked_flex: 440,
  normal_draft: 400,
  normal_blind: 430,
};

export async function analyserDuo(input: AnalyseDuoInput) {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error("RIOT_API_KEY manquante dans Vercel.");

  const adc = await getCompte(input.adcName, input.adcTag, apiKey);
  await pause(650);
  const support = await getCompte(input.suppName, input.suppTag, apiKey);
  await pause(650);

  const ids = input.rangeMode === "season2026"
    ? await getMatchsSaison(adc.puuid, input.queueFilter ?? "all", apiKey)
    : await getMatchsRecents(adc.puuid, input.count ?? 20, input.queueFilter ?? "all", apiKey);

  const statsMap = creerStatsVides();
  const historique = [];
  const timelineMap = new Map<string, { date: string; games: number; wins: number }>();

  for (const id of ids) {
    await pause(850);
    const match = await getMatch(id, apiKey);
    const joueurs = match.info.participants;

    const pAdc = joueurs.find((p) => p.puuid === adc.puuid);
    const pSupp = joueurs.find((p) => p.puuid === support.puuid);

    if (!pAdc || !pSupp) continue;
    if (pAdc.teamId !== pSupp.teamId) continue;

    const idCombo = comboId(pAdc.championName, pSupp.championName);
    const suivi = comboIdsSuivis.has(idCombo);

    if (suivi) {
      const stat = statsMap.get(idCombo);
      if (stat) {
        const kda = (pAdc.kills + pSupp.kills + pAdc.assists + pSupp.assists) / Math.max(1, pAdc.deaths + pSupp.deaths);
        stat.games += 1;
        stat.wins += pAdc.win ? 1 : 0;
        stat.kdaTotal += kda;
        stat.damageTotal += pAdc.totalDamageDealtToChampions + pSupp.totalDamageDealtToChampions;
        stat.visionTotal += pAdc.visionScore + pSupp.visionScore;
        stat.goldTotal += pAdc.goldEarned + pSupp.goldEarned;
        stat.csTotal += (pAdc.totalMinionsKilled ?? 0) + (pAdc.neutralMinionsKilled ?? 0);

        const dateKey = new Date(match.info.gameCreation).toISOString().slice(0, 10);
        const jour = timelineMap.get(dateKey) ?? { date: dateKey, games: 0, wins: 0 };
        jour.games += 1;
        jour.wins += pAdc.win ? 1 : 0;
        timelineMap.set(dateKey, jour);
      }
    }

    historique.push({
      matchId: match.metadata.matchId,
      date: new Date(match.info.gameCreation).toISOString(),
      dureeMin: Math.round(match.info.gameDuration / 60),
      patch: match.info.gameVersion?.split(".").slice(0, 2).join("."),
      victoire: pAdc.win,
      file: nomFile(match.info.queueId),
      comboId: idCombo,
      suivi,
      carry: pAdc.championName,
      support: pSupp.championName,
      kdaCarry: `${pAdc.kills}/${pAdc.deaths}/${pAdc.assists}`,
      kdaSupport: `${pSupp.kills}/${pSupp.deaths}/${pSupp.assists}`,
      degats: pAdc.totalDamageDealtToChampions + pSupp.totalDamageDealtToChampions,
      vision: pAdc.visionScore + pSupp.visionScore,
    });
  }

  const statsCombos = Array.from(statsMap.values()).map((s) => {
    const games = s.games;
    const winrate = games ? Math.round((s.wins / games) * 100) : null;
    const confiance = games >= 10 ? "Haute" : games >= 4 ? "Moyenne" : games >= 1 ? "Faible" : "Théorique";
    const scoreReel = games ? Math.round((winrate ?? 0) * 0.72 + Math.min(games * 2.2, 24) + (s.kdaTotal / games) * 3) : null;

    return {
      id: s.id,
      carry: s.carry,
      support: s.support,
      scoreTheorique: s.scoreTheorique,
      scoreReel,
      games,
      wins: s.wins,
      winrate,
      kdaMoyen: games ? arrondi(s.kdaTotal / games, 2) : null,
      degatsMoyens: games ? Math.round(s.damageTotal / games) : null,
      visionMoyenne: games ? Math.round(s.visionTotal / games) : null,
      goldMoyen: games ? Math.round(s.goldTotal / games) : null,
      csMoyen: games ? arrondi(s.csTotal / games, 1) : null,
      confiance,
    };
  }).sort((a, b) => {
    const scoreA = a.scoreReel ?? a.scoreTheorique;
    const scoreB = b.scoreReel ?? b.scoreTheorique;
    return scoreB - scoreA;
  });

  const totalGames = statsCombos.reduce((sum, s) => sum + s.games, 0);
  const totalWins = statsCombos.reduce((sum, s) => sum + s.wins, 0);

  const timeline = Array.from(timelineMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((j) => ({ ...j, winrate: Math.round((j.wins / j.games) * 100) }));

  const fileMap = new Map<string, { file: string; games: number; wins: number }>();
  for (const m of historique) {
    const f = fileMap.get(m.file) ?? { file: m.file, games: 0, wins: 0 };
    f.games += 1;
    f.wins += m.victoire ? 1 : 0;
    fileMap.set(m.file, f);
  }

  const statsFiles = Array.from(fileMap.values()).map((f) => ({
    ...f,
    winrate: Math.round((f.wins / f.games) * 100),
  }));

  return {
    resume: {
      matchsScannes: ids.length,
      gamesDuo: totalGames,
      victoires: totalWins,
      winrate: totalGames ? Math.round((totalWins / totalGames) * 100) : null,
      analyseLe: new Date().toISOString(),
      periode: input.rangeMode === "season2026" ? "Saison 2026" : "Games récentes",
      file: input.queueFilter ?? "all",
    },
    statsCombos,
    historique: historique.slice(0, 30),
    graphiques: {
      timeline,
      statsFiles,
      topCombos: statsCombos.filter((s) => s.games > 0).slice(0, 8),
    },
  };
}

async function getCompte(gameName: string, tagLine: string, apiKey: string): Promise<RiotAccount> {
  const url = `${BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer ${gameName}#${tagLine}. Code ${res.status}`);
  return res.json();
}

async function getMatchsRecents(puuid: string, count: number, queueFilter: string, apiKey: string): Promise<string[]> {
  const safeCount = Math.min(Math.max(count, 5), 100);
  const queue = QUEUES[queueFilter] ?? null;
  const queueParam = queue ? `&queue=${queue}` : "";
  const url = `${BASE}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${safeCount}${queueParam}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer les matchs. Code ${res.status}`);
  return res.json();
}

async function getMatchsSaison(puuid: string, queueFilter: string, apiKey: string): Promise<string[]> {
  const queue = QUEUES[queueFilter] ?? null;
  const queueParam = queue ? `&queue=${queue}` : "";
  const ids: string[] = [];

  for (let start = 0; start < MAX_MATCHS_SAISON; start += 100) {
    await pause(900);
    const url = `${BASE}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=100&startTime=${DEBUT_SAISON_2026}${queueParam}`;
    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
    if (!res.ok) throw new Error(`Impossible de récupérer les matchs de saison. Code ${res.status}`);
    const page: string[] = await res.json();
    ids.push(...page);
    if (page.length < 100) break;
  }

  return ids;
}

async function getMatch(matchId: string, apiKey: string): Promise<RiotMatch> {
  const url = `${BASE}/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer un match. Code ${res.status}`);
  return res.json();
}

function creerStatsVides() {
  return new Map(combos.map((c) => [c.id, {
    id: c.id,
    carry: c.carry,
    support: c.support,
    scoreTheorique: scoreTheorique(c),
    games: 0,
    wins: 0,
    kdaTotal: 0,
    damageTotal: 0,
    visionTotal: 0,
    goldTotal: 0,
    csTotal: 0,
  }]));
}

function nomFile(queueId: number) {
  if (queueId === 420) return "Solo/Duo";
  if (queueId === 440) return "Flex";
  if (queueId === 400) return "Normal Draft";
  if (queueId === 430) return "Normal Blind";
  return `File ${queueId}`;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function arrondi(v: number, d: number) {
  const m = 10 ** d;
  return Math.round(v * m) / m;
}
