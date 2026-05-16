
import { comboId, comboIdsSuivis } from "@/lib/combos";

type RiotAccount = { puuid: string; gameName: string; tagLine: string };

type Participant = {
  puuid: string;
  championName: string;
  teamId: number;
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
    queueId: number;
    gameVersion: string;
    participants: Participant[];
  };
};

const BASE = "https://europe.api.riotgames.com";
const DEBUT_SAISON_2026 = Math.floor(new Date("2026-01-08T00:00:00Z").getTime() / 1000);

const QUEUES: Record<string, number | null> = {
  all: null,
  ranked_solo: 420,
  ranked_flex: 440,
  normal_draft: 400,
  normal_blind: 430,
};

export async function preparer(input: {
  adcName: string;
  adcTag: string;
  suppName: string;
  suppTag: string;
  count: number;
  rangeMode: "recent" | "season2026";
  queueFilter: string;
}) {
  const apiKey = getKey();

  const adc = await compte(input.adcName, input.adcTag, apiKey);
  const support = await compte(input.suppName, input.suppTag, apiKey);

  const matchIds = input.rangeMode === "season2026"
    ? await idsSaison(adc.puuid, input.queueFilter, apiKey)
    : await idsRecents(adc.puuid, input.count, input.queueFilter, apiKey);

  return {
    adc,
    support,
    matchIds,
    total: matchIds.length,
  };
}

export async function analyserLot(input: {
  matchIds: string[];
  adcPuuid: string;
  supportPuuid: string;
}) {
  const apiKey = getKey();
  const matchs = [];

  for (const id of input.matchIds.slice(0, 6)) {
    const match = await details(id, apiKey);
    const adc = match.info.participants.find((p) => p.puuid === input.adcPuuid);
    const supp = match.info.participants.find((p) => p.puuid === input.supportPuuid);

    if (!adc || !supp) continue;
    if (adc.teamId !== supp.teamId) continue;

    const idCombo = comboId(adc.championName, supp.championName);

    matchs.push({
      matchId: match.metadata.matchId,
      date: new Date(match.info.gameCreation).toISOString(),
      dureeMin: Math.round(match.info.gameDuration / 60),
      patch: match.info.gameVersion?.split(".").slice(0, 2).join("."),
      victoire: adc.win,
      file: nomFile(match.info.queueId),
      comboId: idCombo,
      suivi: comboIdsSuivis.has(idCombo),
      carry: adc.championName,
      support: supp.championName,
      kdaCarry: `${adc.kills}/${adc.deaths}/${adc.assists}`,
      kdaSupport: `${supp.kills}/${supp.deaths}/${supp.assists}`,
      kills: adc.kills + supp.kills,
      deaths: adc.deaths + supp.deaths,
      assists: adc.assists + supp.assists,
      degats: adc.totalDamageDealtToChampions + supp.totalDamageDealtToChampions,
      vision: adc.visionScore + supp.visionScore,
      gold: adc.goldEarned + supp.goldEarned,
      cs: (adc.totalMinionsKilled ?? 0) + (adc.neutralMinionsKilled ?? 0),
    });
  }

  return { matchs };
}

async function compte(gameName: string, tagLine: string, apiKey: string): Promise<RiotAccount> {
  const url = `${BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer ${gameName}#${tagLine}. Code ${res.status}`);
  return res.json();
}

async function idsRecents(puuid: string, count: number, queueFilter: string, apiKey: string) {
  const safeCount = Math.min(Math.max(count, 5), 100);
  const queue = QUEUES[queueFilter] ?? null;
  const queueParam = queue ? `&queue=${queue}` : "";
  const url = `${BASE}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${safeCount}${queueParam}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer la liste des matchs. Code ${res.status}`);
  return res.json();
}

async function idsSaison(puuid: string, queueFilter: string, apiKey: string) {
  const queue = QUEUES[queueFilter] ?? null;
  const queueParam = queue ? `&queue=${queue}` : "";
  const ids: string[] = [];

  for (let start = 0; start < 500; start += 100) {
    const url = `${BASE}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=100&startTime=${DEBUT_SAISON_2026}${queueParam}`;
    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
    if (!res.ok) throw new Error(`Impossible de récupérer les matchs de saison. Code ${res.status}`);

    const page: string[] = await res.json();
    ids.push(...page);
    if (page.length < 100) break;
    await pause(1200);
  }

  return ids;
}

async function details(matchId: string, apiKey: string): Promise<RiotMatch> {
  const url = `${BASE}/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de récupérer le match ${matchId}. Code ${res.status}`);
  return res.json();
}

function getKey() {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new Error("RIOT_API_KEY manquante dans Vercel.");
  return key;
}

function nomFile(queueId: number) {
  if (queueId === 420) return "Solo/Duo";
  if (queueId === 440) return "Flex";
  if (queueId === 400) return "Normal Draft";
  if (queueId === 430) return "Normal Blind";
  if (queueId === 490) return "Normal Quickplay";
  return `File ${queueId}`;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
