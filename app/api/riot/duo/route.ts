import { NextResponse } from "next/server";
import { analyserDuo } from "@/lib/riot-analyze";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const adcName = String(body.adcName ?? "").trim();
    const adcTag = String(body.adcTag ?? "").trim();
    const suppName = String(body.suppName ?? "").trim();
    const suppTag = String(body.suppTag ?? "").trim();

    if (!adcName || !adcTag || !suppName || !suppTag) {
      return NextResponse.json({ error: "Renseigne les deux Riot ID complets : pseudo + tag." }, { status: 400 });
    }

    const analyse = await analyserDuo({
      adcName,
      adcTag,
      suppName,
      suppTag,
      count: Number(body.count ?? 20),
      rangeMode: body.rangeMode === "season2026" ? "season2026" : "recent",
      queueFilter: ["all", "ranked_solo", "ranked_flex", "normal_draft", "normal_blind"].includes(body.queueFilter) ? body.queueFilter : "all",
    });

    return NextResponse.json(analyse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
