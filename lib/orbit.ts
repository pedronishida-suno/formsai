export interface OrbitPayload {
  cpf_hash: string;
  indicator_key: "indicador_ia_2026";
  nota_final: number;
  faixa: string;
  percentual_bonus: number;
  evaluation_summary: string;
  flags_fraude: string[];
  submitted_at: string;
  is_locked: boolean;
}

export async function pushToOrbit(payload: OrbitPayload): Promise<void> {
  const url = process.env.ORBIT_WEBHOOK_URL;
  if (!url) {
    console.warn("[orbit] ORBIT_WEBHOOK_URL not set — skipping");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ORBIT_API_KEY ?? ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`[orbit] Webhook failed: ${res.status} ${await res.text()}`);
  }
}
