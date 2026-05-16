export type Combo = {
  id: string;
  carry: string;
  support: string;
  role: "ADC + Support" | "APC + Support";
  style: string;
  difficulte: "Facile" | "Moyen" | "Difficile";
  early: number;
  scaling: number;
  engage: number;
  peel: number;
  poke: number;
  plan: string;
  danger: string;
  contexte: string;
};

export const combos: Combo[] = [
  { id:"twitch-yuumi", carry:"Twitch", support:"Yuumi", role:"ADC + Support", style:"Hyper scaling", difficulte:"Moyen", early:35, scaling:98, engage:35, peel:80, poke:35, plan:"Survivre en début de partie, jouer les resets propres, puis prendre les combats avec l'invisibilité de Twitch et Yuumi attachée.", danger:"Les lanes engage/poke qui punissent avant le niveau 6.", contexte:"Compositions faibles en hard engage ou incapables de tuer Twitch rapidement." },
  { id:"twitch-nami", carry:"Twitch", support:"Nami", role:"ADC + Support", style:"Poke", difficulte:"Moyen", early:58, scaling:86, engage:45, peel:68, poke:78, plan:"Trades courts avec le E de Nami, pression poison, puis roams Twitch après push.", danger:"All-in brutal si Nami rate sa bulle ou si la wave est mal placée.", contexte:"Lanes lentes ou enchanteurs plus faibles en trade court." },
  { id:"twitch-leona", carry:"Twitch", support:"Leona", role:"ADC + Support", style:"All-in", difficulte:"Difficile", early:65, scaling:78, engage:92, peel:42, poke:25, plan:"Chercher la kill lane niveau 2/3, puis snowball avec les engages de Leona et la pression fog de Twitch.", danger:"Si l'all-in échoue, la lane peut devenir très difficile.", contexte:"Lanes immobiles sans cleanse ni peel fort." },
  { id:"twitch-maokai", carry:"Twitch", support:"Maokai", role:"ADC + Support", style:"Catch", difficulte:"Moyen", early:55, scaling:84, engage:82, peel:65, poke:50, plan:"Contrôler les buissons avec les saplings, setup root pour Twitch, jouer les catches autour des objectifs.", danger:"Manque de sustain contre poke lourd.", contexte:"Botlanes courte portée et compositions sensibles au contrôle de zone." },
  { id:"twitch-seraphine", carry:"Twitch", support:"Seraphine", role:"ADC + Support", style:"Teamfight", difficulte:"Moyen", early:48, scaling:90, engage:65, peel:82, poke:66, plan:"Lane safe, waveclear, puis teamfights groupés avec ultime de Seraphine et DPS de Twitch.", danger:"Duo vulnérable si l'engage adverse est très rapide.", contexte:"Compositions qui doivent rentrer en ligne droite." },

  { id:"jinx-yuumi", carry:"Jinx", support:"Yuumi", role:"ADC + Support", style:"Scaling", difficulte:"Moyen", early:40, scaling:92, engage:32, peel:84, poke:42, plan:"Farm propre, limiter les morts early, jouer front-to-back et resets Jinx.", danger:"Manque de pression lane et vulnérabilité aux dives.", contexte:"Compositions peu menaçantes early ou avec frontline alliée." },
  { id:"jinx-nami", carry:"Jinx", support:"Nami", role:"ADC + Support", style:"Peel", difficulte:"Moyen", early:56, scaling:88, engage:54, peel:78, poke:72, plan:"Trades avec roquettes + E de Nami, sécuriser la lane, puis jouer peel et resets.", danger:"Engage adverse si Jinx n'a pas flash.", contexte:"Lanes qui ne peuvent pas hard engage en boucle." },
  { id:"jinx-leona", carry:"Jinx", support:"Leona", role:"ADC + Support", style:"All-in", difficulte:"Facile", early:78, scaling:84, engage:96, peel:48, poke:35, plan:"Prendre le niveau 2, forcer l'all-in, enchaîner le contrôle avec les pièges de Jinx.", danger:"Si vous perdez la prio, Leona peut devenir inutile sous tour.", contexte:"Botlanes fragiles ou sans mobilité." },
  { id:"jinx-maokai", carry:"Jinx", support:"Maokai", role:"ADC + Support", style:"Contrôle", difficulte:"Facile", early:62, scaling:86, engage:82, peel:74, poke:52, plan:"Contrôle de zone, root + traps, puis teamfight autour des objectifs.", danger:"Peut manquer de pression contre poke très long range.", contexte:"Compositions engage ou objectifs serrés." },
  { id:"jinx-seraphine", carry:"Jinx", support:"Seraphine", role:"ADC + Support", style:"Teamfight", difficulte:"Facile", early:55, scaling:94, engage:68, peel:88, poke:70, plan:"Waveclear, sustain, attendre les items de Jinx puis teamfight front-to-back.", danger:"Peut subir les hard engages avant deux items.", contexte:"Compositions lentes et combats groupés." },

  { id:"zeri-yuumi", carry:"Zeri", support:"Yuumi", role:"ADC + Support", style:"Hyper scaling", difficulte:"Difficile", early:34, scaling:99, engage:35, peel:90, poke:35, plan:"Ne pas mourir early, jouer tempo, puis prendre les fights prolongés.", danger:"Très punissable avant items.", contexte:"Compositions peu capables de lock Zeri." },
  { id:"zeri-nami", carry:"Zeri", support:"Nami", role:"ADC + Support", style:"Scaling", difficulte:"Difficile", early:50, scaling:90, engage:48, peel:78, poke:68, plan:"Trades courts, sustain lane, garder Zeri en vie jusqu'aux fights longs.", danger:"Manque de hard CC fiable.", contexte:"Duo bot sans gros lockdown." },
  { id:"zeri-leona", carry:"Zeri", support:"Leona", role:"ADC + Support", style:"All-in", difficulte:"Difficile", early:68, scaling:82, engage:94, peel:45, poke:25, plan:"Punir les erreurs de placement, créer l'espace pour que Zeri chase.", danger:"Synergie moins naturelle si Zeri ne peut pas follow l'engage.", contexte:"Lanes fragiles sans disengage." },
  { id:"zeri-maokai", carry:"Zeri", support:"Maokai", role:"ADC + Support", style:"Catch", difficulte:"Moyen", early:58, scaling:88, engage:82, peel:72, poke:52, plan:"Contrôle vision, catch, puis fight long où Zeri peut kite.", danger:"Peut manquer de dégâts early.", contexte:"Compositions mêlée ou sensibles au contrôle de zone." },
  { id:"zeri-seraphine", carry:"Zeri", support:"Seraphine", role:"ADC + Support", style:"Teamfight", difficulte:"Moyen", early:46, scaling:96, engage:68, peel:90, poke:68, plan:"Jouer très propre en lane, puis group 5v5 avec énorme scaling.", danger:"Très faible si la game explose avant 15 minutes.", contexte:"Compositions peu agressives early." },

  { id:"senna-yuumi", carry:"Senna", support:"Yuumi", role:"ADC + Support", style:"Scaling", difficulte:"Difficile", early:38, scaling:82, engage:25, peel:72, poke:70, plan:"Jouer poke et sustain, scale avec les âmes, éviter les hard engages.", danger:"Très fragile aux dives et all-ins.", contexte:"Lanes passives ou très faibles en engage." },
  { id:"senna-nami", carry:"Senna", support:"Nami", role:"ADC + Support", style:"Poke", difficulte:"Moyen", early:64, scaling:80, engage:48, peel:74, poke:90, plan:"Dominer par poke/sustain, prendre les trades courts, stack les âmes.", danger:"All-in adverse si vous avancez sans vision.", contexte:"Lanes low sustain ou courte portée." },
  { id:"senna-leona", carry:"Senna", support:"Leona", role:"ADC + Support", style:"Catch", difficulte:"Moyen", early:72, scaling:76, engage:96, peel:52, poke:58, plan:"Leona lock, Senna follow avec root + poke. Très fort sur pick isolé.", danger:"Senna peut manquer de DPS front-to-back.", contexte:"Botlanes squishy et immobiles." },
  { id:"senna-maokai", carry:"Senna", support:"Maokai", role:"ADC + Support", style:"Catch", difficulte:"Facile", early:68, scaling:84, engage:86, peel:78, poke:78, plan:"Contrôle buissons, poke, root chain, très bon autour des objectifs.", danger:"Peut manquer de burst immédiat.", contexte:"Lanes qui ne peuvent pas contester la vision." },
  { id:"senna-seraphine", carry:"Senna", support:"Seraphine", role:"ADC + Support", style:"Safe lane", difficulte:"Facile", early:60, scaling:92, engage:64, peel:92, poke:86, plan:"Double poke, sustain, waveclear, puis teamfight très fort.", danger:"Vulnérable aux hard engages coordonnés.", contexte:"Compositions lentes et lanes sans engage instantané." },

  { id:"seraphine-yuumi", carry:"Seraphine", support:"Yuumi", role:"APC + Support", style:"Safe lane", difficulte:"Moyen", early:46, scaling:90, engage:54, peel:92, poke:72, plan:"Farm safe, sustain, teamfight énorme avec shields/heals et ultime de Seraphine.", danger:"Manque de pression kill lane.", contexte:"Compositions incapables de punir une lane passive." },
  { id:"seraphine-nami", carry:"Seraphine", support:"Nami", role:"APC + Support", style:"Poke", difficulte:"Facile", early:62, scaling:88, engage:62, peel:84, poke:88, plan:"Poke, sustain, waveclear et fight groupé avec double contrôle.", danger:"Peut manquer de dégâts physiques dans la compo.", contexte:"Lanes fragiles et compositions faibles au poke." },
  { id:"seraphine-leona", carry:"Seraphine", support:"Leona", role:"APC + Support", style:"All-in", difficulte:"Moyen", early:76, scaling:84, engage:98, peel:68, poke:58, plan:"Leona engage, Seraphine follow avec E/ulti. Très fort en CC chain.", danger:"Si Leona rate ses engages, lane moins oppressante.", contexte:"Duo fragile, sans cleanse ni dash." },
  { id:"seraphine-maokai", carry:"Seraphine", support:"Maokai", role:"APC + Support", style:"Contrôle", difficulte:"Facile", early:70, scaling:92, engage:90, peel:92, poke:78, plan:"Contrôle total des zones, waveclear, CC chain et teamfight monstrueux.", danger:"Peut manquer de DPS si la team n'a pas de dégâts continus.", contexte:"Compositions mêlée et objectifs serrés." }
];

export function comboId(carry: string, support: string) {
  return `${carry}-${support}`.toLowerCase().replaceAll(" ", "-").replaceAll("'", "");
}

export function scoreTheorique(combo: Combo) {
  return Math.round((combo.early + combo.scaling + combo.engage + combo.peel + combo.poke) / 5);
}

export const comboIdsSuivis = new Set(combos.map((combo) => combo.id));
