
import { NextResponse } from "next/server";
import { analyserLot } from "@/lib/riot-progressif";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const matchIds = Array.isArray(body.matchIds) ? body.matchIds.slice(0, 6) : [];
    const adcPuuid = String(body.adcPuuid ?? "");
    const supportPuuid = String(body.supportPuuid ?? "");

    if (!matchIds.length || !adcPuuid || !supportPuuid) {
      return NextResponse.json({ error: "Données du lot incomplètes." }, { status: 400 });
    }

    const data = await analyserLot({ matchIds, adcPuuid, supportPuuid });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
