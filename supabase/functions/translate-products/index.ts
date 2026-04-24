// Pre-translate the entire product catalog into FR + RW + EN baseline rows.
// Caches results in public.products_i18n so the UI can switch instantly.
// Admin-triggered, runs in batches via Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Product {
  id: number;
  name: string;
  category: string;
  unit?: string;
}

const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { products, languages } = (await req.json()) as {
      products: Product[];
      languages?: string[];
    };
    const langs = languages?.length ? languages : ["EN", "FR", "RW"];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // verify caller is admin via the JWT
    const auth = req.headers.get("Authorization") ?? "";
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userJson = await userResp.json();
    const userId = userJson?.id;
    const roleResp = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=id`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } },
    );
    const roles = await roleResp.json();
    if (!Array.isArray(roles) || roles.length === 0) {
      return new Response(JSON.stringify({ error: "admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalUpserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      for (const lang of langs) {
        // EN we just store as-is (no AI call)
        if (lang === "EN") {
          const rows = batch.map((p) => ({
            product_id: p.id, lang: "EN",
            name: p.name, category: p.category, unit: p.unit ?? null,
          }));
          const r = await fetch(`${SUPABASE_URL}/rest/v1/products_i18n`, {
            method: "POST",
            headers: {
              apikey: SERVICE,
              Authorization: `Bearer ${SERVICE}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(rows),
          });
          if (r.ok) totalUpserted += rows.length;
          else errors.push(`EN insert: ${await r.text()}`);
          continue;
        }

        const langName = lang === "FR" ? "French" : "Kinyarwanda (Rwanda)";
        const prompt = `Translate the following supermarket product names and category names from English to ${langName}. Keep brand names, units (kg, ml, l), and numbers UNCHANGED. Reply ONLY with a JSON array, same order, where each element is {"id": <id>, "name": "<translated name>", "category": "<translated category>"}. Items:
${batch.map((p) => `- id ${p.id}: name="${p.name}" | category="${p.category}"`).join("\n")}`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `You are a precise translator. Always reply only with a valid JSON array, no prose.` },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResp.ok) {
          if (aiResp.status === 429 || aiResp.status === 402) {
            return new Response(
              JSON.stringify({
                error: aiResp.status === 429 ? "rate_limited" : "credits_exhausted",
                upserted: totalUpserted,
              }),
              { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          errors.push(`AI ${lang} batch ${i}: ${aiResp.status}`);
          continue;
        }

        const aiJson = await aiResp.json();
        const text: string = aiJson.choices?.[0]?.message?.content ?? "";
        const cleaned = text.replace(/```json|```/g, "").trim();
        let parsed: Array<{ id: number; name: string; category: string }> = [];
        try {
          const m = cleaned.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(m ? m[0] : cleaned);
        } catch (e) {
          errors.push(`parse ${lang} batch ${i}: ${(e as Error).message}`);
          continue;
        }

        const rows = parsed
          .filter((x) => x && typeof x.id === "number")
          .map((x) => {
            const src = batch.find((p) => p.id === x.id);
            return {
              product_id: x.id,
              lang,
              name: x.name || src?.name || "",
              category: x.category || src?.category || null,
              unit: src?.unit ?? null,
            };
          });

        if (rows.length) {
          const r = await fetch(`${SUPABASE_URL}/rest/v1/products_i18n`, {
            method: "POST",
            headers: {
              apikey: SERVICE,
              Authorization: `Bearer ${SERVICE}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(rows),
          });
          if (r.ok) totalUpserted += rows.length;
          else errors.push(`${lang} insert: ${await r.text()}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, upserted: totalUpserted, errors: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("translate-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
