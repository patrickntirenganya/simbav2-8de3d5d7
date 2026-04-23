// Simba AI shopping assistant — uses Lovable AI Gateway (Gemini)
// Grounded with the product catalog so answers are accurate, not generic.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CatalogItem {
  id: number;
  name: string;
  price: number;
  category: string;
  unit: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, catalog, lang } = (await req.json()) as {
      messages: ChatMessage[];
      catalog: CatalogItem[];
      lang?: "EN" | "FR" | "RW";
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Trim catalog to keep context tight & cheap (top 250 items, compact form)
    const trimmed = (catalog ?? []).slice(0, 250);
    const catalogText = trimmed
      .map((p) => `${p.id}|${p.name}|${p.category}|${p.price}RWF|${p.unit}`)
      .join("\n");

    const langName = lang === "FR" ? "French" : lang === "RW" ? "Kinyarwanda" : "English";

    const systemPrompt = `You are Simba, the friendly AI shopping assistant for Simba Supermarket in Kigali, Rwanda.

RULES:
- Reply in ${langName}.
- Be concise, warm, and helpful. Use short paragraphs and bullet points.
- Use ONLY the product catalog below to recommend items. Never invent products or prices.
- When recommending products, list them as: • [Product name] — [price] RWF
- If a user asks something general (recipes, meal ideas, occasions), suggest 3–6 relevant items from the catalog.
- If nothing matches, say so honestly and suggest the closest categories available.
- Currency is always Rwandan Franc (RWF).
- Mention that orders are picked up at the customer's chosen Simba branch.

CATALOG (id|name|category|price|unit):
${catalogText}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable. Try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
