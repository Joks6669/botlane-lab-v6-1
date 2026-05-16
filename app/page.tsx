"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { combos, scoreTheorique } from "@/lib/combos";

type StatCombo = {
  id: string;
  carry: string;
  support: string;
  scoreTheorique: number;
  scoreReel: number | null;
  games: number;
  wins: number;
  winrate: number | null;
  kdaMoyen: number | null;
  degatsMoyens: number | null;
  visionMoyenne: number | null;
  goldMoyen: number | null;
  csMoyen: number | null;
  confiance: "Haute" | "Moyenne" | "Faible" | "Théorique";
};

type Analyse = {
  resume: {
    matchsScannes: number;
    gamesDuo: number;
    victoires: number;
    winrate: number | null;
    analyseLe: string;
    periode: string;
    file: string;
  };
  statsCombos: StatCombo[];
  historique: Array<{
    matchId: string;
    date: string;
    dureeMin: number;
    patch: string;
    victoire: boolean;
    file: string;
    carry: string;
    support: string;
    kdaCarry: string;
    kdaSupport: string;
    suivi: boolean;
  }>;
  graphiques: {
    timeline: Array<{ date: string; games: number; wins: number; winrate: number }>;
    statsFiles: Array<{ file: string; games: number; wins: number; winrate: number }>;
    topCombos: StatCombo[];
  };
};

const styles = ["Tous", "Hyper scaling", "Scaling", "All-in", "Poke", "Catch", "Peel", "Teamfight", "Safe lane", "Contrôle"];
const carries = ["Tous", "Twitch", "Jinx", "Zeri", "Senna", "Seraphine"];
const supports = ["Tous", "Yuumi", "Nami", "Leona", "Maokai", "Seraphine"];

export default function Home() {
  const [adcName, setAdcName] = useState("PepitoGT");
  const [adcTag, setAdcTag] = useState("");
  const [suppName, setSuppName] = useState("Joks");
  const [suppTag, setSuppTag] = useState("");
  const [rangeMode, setRangeMode] = useState("recent");
  const [count, setCount] = useState("20");
  const [queueFilter, setQueueFilter] = useState("all");
  const [style, setStyle] = useState("Tous");
  const [carry, setCarry] = useState("Tous");
  const [support, setSupport] = useState("Tous");
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);
  const [progression, setProgression] = useState({ faits: 0, total: 0 });

  const statsMap = useMemo(() => new Map((analyse?.statsCombos ?? []).map((s) => [s.id, s])), [analyse]);

  const combosAffiches = useMemo(() => {
    return combos
      .filter((c) => carry === "Tous" || c.carry === carry)
      .filter((c) => support === "Tous" || c.support === support)
      .filter((c) => style === "Tous" || c.style === style)
      .map((c) => {
        const stat = statsMap.get(c.id);
        const score = stat?.scoreReel ?? stat?.scoreTheorique ?? scoreTheorique(c);
        return { ...c, stat, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [style, carry, support, statsMap]);

  const meilleur = combosAffiches[0];
  const meilleurStat = meilleur?.stat;

  async function synchroniser() {
    setChargement(true);
    setMessage("Préparation de la liste des matchs...");
    setAnalyse(null);
    setProgression({ faits: 0, total: 0 });

    try {
      const prepResponse = await fetch("/api/riot/preparer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adcName, adcTag, suppName, suppTag, rangeMode, count: Number(count), queueFilter })
      });

      const prep = await prepResponse.json();
      if (!prepResponse.ok) throw new Error(prep.error ?? "Erreur pendant la préparation.");

      const ids: string[] = prep.matchIds;
      const matchsDuo: any[] = [];
      setProgression({ faits: 0, total: ids.length });
      setMessage(`${ids.length} matchs à scanner. Analyse progressive par lots de 6.`);

      for (let i = 0; i < ids.length; i += 6) {
        const lot = ids.slice(i, i + 6);

        const lotResponse = await fetch("/api/riot/lot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchIds: lot,
            adcPuuid: prep.adc.puuid,
            supportPuuid: prep.support.puuid
          })
        });

        const data = await lotResponse.json();
        if (!lotResponse.ok) throw new Error(data.error ?? "Erreur pendant l'analyse d'un lot.");

        matchsDuo.push(...data.matchs);

        const faits = Math.min(i + 6, ids.length);
        setProgression({ faits, total: ids.length });
        setMessage(`Analyse en cours : ${faits}/${ids.length} matchs scannés. ${matchsDuo.length} parties duo trouvées.`);

        if (faits < ids.length) {
          await new Promise((resolve) => setTimeout(resolve, 8500));
        }
      }

      const analyseFinale = construireAnalyseLocale(matchsDuo, ids.length);
      setAnalyse(analyseFinale);
      setMessage(`Analyse terminée : ${analyseFinale.summary.duoGames} parties duo trouvées sur ${ids.length} matchs scannés.`);
      localStorage.setItem("botlane-lab-v6-derniere-analyse", JSON.stringify(analyseFinale));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setChargement(false);
    }
  }

  function chargerCache() {
    const cache = localStorage.getItem("botlane-lab-v6-derniere-analyse");
    if (!cache) {
      setMessage("Aucune analyse sauvegardée dans ce navigateur.");
      return;
    }
    setAnalyse(JSON.parse(cache));
    setMessage("Dernière analyse locale rechargée.");
  }

  return (
    <div className="app">
      <aside className="barre">
        <div className="marque">
          <div className="icone">BL</div>
          <div>
            <strong>Botlane Lab</strong>
            <span>Analyse duo française</span>
          </div>
        </div>

        <nav>
          <a href="#accueil">Accueil</a>
          <a href="#synchronisation">Synchronisation</a>
          <a href="#graphiques">Graphiques</a>
          <a href="#combos">Combos</a>
          <a href="#historique">Historique</a>
        </nav>

        <div className="panneau-mini">
          <span>Objectif V6</span>
          <p>Une analyse progressive pour stabiliser Riot avant d’ajouter les vidéos.</p>
        </div>
      </aside>

      <main className="contenu" id="accueil">
        <section className="hero">
          <div>
            <p className="surtitre">Système d'analyse botlane</p>
            <h1>Votre duo, analysé comme une équipe compétitive.</h1>
            <p className="intro">
              Scannez vos parties, identifiez vos meilleurs combos, suivez votre progression et transformez vos games en plan d'entraînement.
            </p>
          </div>

          <div className="carte neon" id="synchronisation">
            <div className="titre-carte">Synchronisation Riot</div>

            <div className="ligne-form">
              <input value={adcName} onChange={(e) => setAdcName(e.target.value)} placeholder="Pseudo ADC" />
              <input value={adcTag} onChange={(e) => setAdcTag(e.target.value)} placeholder="TAG" />
            </div>

            <div className="ligne-form">
              <input value={suppName} onChange={(e) => setSuppName(e.target.value)} placeholder="Pseudo support" />
              <input value={suppTag} onChange={(e) => setSuppTag(e.target.value)} placeholder="TAG" />
            </div>

            <select value={rangeMode} onChange={(e) => setRangeMode(e.target.value)}>
              <option value="recent">Parties récentes</option>
              <option value="season2026">Saison 2026 complète</option>
            </select>

            {rangeMode === "recent" && (
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                <option value="10">10 dernières parties</option>
                <option value="20">20 dernières parties</option>
                <option value="50">50 dernières parties</option>
                <option value="100">100 dernières parties</option>
              </select>
            )}

            <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)}>
              <option value="all">Toutes les files</option>
              <option value="ranked_solo">Classée Solo/Duo</option>
              <option value="ranked_flex">Classée Flex</option>
              <option value="normal_draft">Normale Draft</option>
              <option value="normal_blind">Normale Blind</option>
            </select>

            <button onClick={synchroniser} disabled={chargement}>
              {chargement ? "Analyse en cours..." : "Lancer l'analyse progressive"}
            </button>

            <button className="secondaire" onClick={chargerCache}>Recharger la dernière analyse</button>

            {progression.total > 0 && (
              <div className="progression">
                <div><span style={{ width: `${Math.round((progression.faits / progression.total) * 100)}%` }} /></div>
                <p>{progression.faits}/{progression.total} matchs scannés</p>
              </div>
            )}
            {message && <p className="message">{message}</p>}
          </div>
        </section>

        <section className="stats-rapides">
          <div className="carte stat-principale">
            <span>Meilleur combo actuel</span>
            <strong>{meilleur ? `${meilleur.carry} + ${meilleur.support}` : "—"}</strong>
            <p>{meilleurStat?.games ? `${meilleurStat.winrate}% de winrate réel sur ${meilleurStat.games} parties` : "Score théorique en attente de données réelles"}</p>
          </div>
          <div className="carte">
            <span>Winrate duo</span>
            <strong>{analyse?.resume.winrate ?? "—"}{analyse?.resume.winrate ? "%" : ""}</strong>
            <p>{analyse ? `${analyse.resume.victoires} victoires / ${analyse.resume.gamesDuo} parties` : "Aucune analyse lancée"}</p>
          </div>
          <div className="carte">
            <span>Parties duo trouvées</span>
            <strong>{analyse?.resume.gamesDuo ?? 0}</strong>
            <p>{analyse ? `${analyse.resume.matchsScannes} matchs scannés` : "En attente"}</p>
          </div>
          <div className="carte">
            <span>Niveau de fiabilité</span>
            <strong>{analyse?.resume.gamesDuo ? "Réel" : "Théorique"}</strong>
            <p>Haute confiance à partir de 10 parties par combo</p>
          </div>
        </section>

        <section className="grille-principale" id="graphiques">
          <div className="carte graphique">
            <div className="entete-section">
              <div>
                <p className="surtitre">Graphiques dynamiques</p>
                <h2>Évolution du winrate</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analyse?.graphiques.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="winrate" stroke="#a78bfa" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="carte graphique">
            <p className="surtitre">Répartition</p>
            <h2>Performance par file</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analyse?.graphiques.statsFiles ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="file" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="winrate" fill="#22d3ee" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="carte graphique large">
            <p className="surtitre">Synergies dominantes</p>
            <h2>Combos les plus joués</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyse?.graphiques.topCombos ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey={(d) => `${d.carry}+${d.support}`} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="games" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="filtres">
          <select value={carry} onChange={(e) => setCarry(e.target.value)}>
            {carries.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={support} onChange={(e) => setSupport(e.target.value)}>
            {supports.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            {styles.map((s) => <option key={s}>{s}</option>)}
          </select>
        </section>

        <section className="zone-combos" id="combos">
          <div className="carte tableau-combos">
            <div className="entete-section">
              <div>
                <p className="surtitre">Analyse des synergies</p>
                <h2>Combos suivis</h2>
              </div>
            </div>

            <div className="liste-combos">
              {combosAffiches.map((combo) => (
                <article className="ligne-combo" key={combo.id}>
                  <div>
                    <strong>{combo.carry} + {combo.support}</strong>
                    <span>{combo.role} · {combo.style} · {combo.difficulte}</span>
                  </div>
                  <Badge valeur={combo.stat?.confiance ?? "Théorique"} />
                  <MiniStat label="Parties" valeur={combo.stat?.games ?? 0} />
                  <MiniStat label="WR" valeur={combo.stat?.winrate ? `${combo.stat.winrate}%` : "—"} />
                  <MiniStat label="KDA" valeur={combo.stat?.kdaMoyen ?? "—"} />
                  <MiniStat label="Score" valeur={combo.score} />
                </article>
              ))}
            </div>
          </div>

          <aside className="carte recommandation">
            <p className="surtitre">Plan recommandé</p>
            <h2>{meilleur ? `${meilleur.carry} + ${meilleur.support}` : "—"}</h2>
            <p>{meilleur?.plan}</p>

            <div className="bloc-info">
              <span>Danger principal</span>
              <p>{meilleur?.danger}</p>
            </div>

            <div className="bloc-info">
              <span>Meilleur contexte</span>
              <p>{meilleur?.contexte}</p>
            </div>
          </aside>
        </section>

        <section className="carte historique" id="historique">
          <p className="surtitre">Historique partagé</p>
          <h2>Dernières parties détectées ensemble</h2>

          {!analyse?.historique.length && <p className="message">L'historique apparaîtra après synchronisation.</p>}

          <div className="liste-matchs">
            {analyse?.historique.map((m) => (
              <div className="match" key={m.matchId}>
                <div>
                  <strong>{m.carry} + {m.support}</strong>
                  <span>{new Date(m.date).toLocaleDateString("fr-FR")} · {m.file} · patch {m.patch} · {m.dureeMin} min</span>
                </div>
                <b className={m.victoire ? "victoire" : "defaite"}>{m.victoire ? "Victoire" : "Défaite"}</b>
                <span>{m.kdaCarry} / {m.kdaSupport}</span>
                <span>{m.suivi ? "Combo suivi" : "Hors pool"}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}



function construireAnalyseLocale(matchs: any[], matchsScannes: number) {
  const map = new Map(combos.map((c) => [c.id, {
    id: c.id,
    carry: c.carry,
    support: c.support,
    scoreTheorique: scoreTheorique(c),
    scoreReel: null as number | null,
    games: 0,
    wins: 0,
    winrate: null as number | null,
    kdaMoyen: null as number | null,
    degatsMoyens: null as number | null,
    visionMoyenne: null as number | null,
    goldMoyen: null as number | null,
    csMoyen: null as number | null,
    confiance: "Théorique" as "Haute" | "Moyenne" | "Faible" | "Théorique",
    kdaTotal: 0,
    degatsTotal: 0,
    visionTotal: 0,
    goldTotal: 0,
    csTotal: 0,
  }]));

  const timeline = new Map<string, { date: string; games: number; wins: number }>();
  const files = new Map<string, { file: string; games: number; wins: number }>();

  for (const m of matchs) {
    const stat = map.get(m.comboId);
    if (stat) {
      stat.games += 1;
      stat.wins += m.victoire ? 1 : 0;
      stat.kdaTotal += (m.kills + m.assists) / Math.max(1, m.deaths);
      stat.degatsTotal += m.degats;
      stat.visionTotal += m.vision;
      stat.goldTotal += m.gold;
      stat.csTotal += m.cs;
    }

    const jour = String(m.date).slice(0, 10);
    const t = timeline.get(jour) ?? { date: jour, games: 0, wins: 0 };
    t.games += 1;
    t.wins += m.victoire ? 1 : 0;
    timeline.set(jour, t);

    const f = files.get(m.file) ?? { file: m.file, games: 0, wins: 0 };
    f.games += 1;
    f.wins += m.victoire ? 1 : 0;
    files.set(m.file, f);
  }

  const statsCombos = Array.from(map.values()).map((s: any) => {
    if (s.games) {
      s.winrate = Math.round((s.wins / s.games) * 100);
      s.kdaMoyen = arrondi(s.kdaTotal / s.games, 2);
      s.degatsMoyens = Math.round(s.degatsTotal / s.games);
      s.visionMoyenne = Math.round(s.visionTotal / s.games);
      s.goldMoyen = Math.round(s.goldTotal / s.games);
      s.csMoyen = arrondi(s.csTotal / s.games, 1);
      s.confiance = s.games >= 10 ? "Haute" : s.games >= 4 ? "Moyenne" : "Faible";
      s.scoreReel = Math.round((s.winrate ?? 0) * 0.72 + Math.min(s.games * 2.2, 24) + (s.kdaMoyen ?? 0) * 3);
    }
    return s;
  }).sort((a: any, b: any) => (b.scoreReel ?? b.scoreTheorique) - (a.scoreReel ?? a.scoreTheorique));

  const gamesDuo = statsCombos.reduce((n: number, s: any) => n + s.games, 0);
  const victoires = statsCombos.reduce((n: number, s: any) => n + s.wins, 0);

  return {
    resume: {
      matchsScannes,
      gamesDuo,
      victoires,
      winrate: gamesDuo ? Math.round((victoires / gamesDuo) * 100) : null,
      analyseLe: new Date().toISOString(),
      periode: "Analyse progressive",
      file: "Toutes les files",
    },
    statsCombos,
    historique: matchs.slice(0, 40),
    graphiques: {
      timeline: Array.from(timeline.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((x) => ({ ...x, winrate: Math.round((x.wins / x.games) * 100) })),
      statsFiles: Array.from(files.values())
        .map((x) => ({ ...x, winrate: Math.round((x.wins / x.games) * 100) })),
      topCombos: statsCombos.filter((x: any) => x.games > 0).slice(0, 8),
    },
  };
}

function MiniStat({ label, valeur }: { label: string; valeur: string | number }) {
  return <div className="mini"><strong>{valeur}</strong><span>{label}</span></div>;
}

function Badge({ valeur }: { valeur: string }) {
  return <span className={`badge ${valeur.toLowerCase()}`}>{valeur}</span>;
}
function arrondi(nombre: number, decimals = 0) {
  return Number(nombre.toFixed(decimals));
}
