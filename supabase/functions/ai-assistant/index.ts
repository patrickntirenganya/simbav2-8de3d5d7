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
  in_stock?: boolean;
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

    // Send the FULL catalog — Simba AI has access to every product.
    const full = catalog ?? [];
    const inStockCount = full.filter((p) => p.in_stock !== false).length;
    const catalogText = full
      .map((p) => `${p.id}|${p.name}|${p.category}|${p.price}RWF|${p.unit}|${p.in_stock === false ? "OUT" : "OK"}`)
      .join("\n");

    const langName = lang === "FR" ? "French" : lang === "RW" ? "Kinyarwanda" : "English";

    const systemPrompt = `You are Simba, the official AI shopping assistant for Simba Supermarket in Kigali, Rwanda.

YOU HAVE FULL ACCESS to the complete Simba product catalog (${full.length} products, ${inStockCount} currently in stock across our branches). Never say you don't have access to products — you do. Use the catalog below as your source of truth.

RULES:
- Reply in ${langName}. Be warm, concise, and helpful. Use short paragraphs and bullet points.
- Recommend products ONLY from the catalog. Never invent products or prices.
- Format recommendations as: • [Product name] — [price] RWF
- If an item shows OUT, mention it is currently out of stock and suggest an in-stock alternative.
- For general questions (recipes, meal ideas, occasions, budgets), suggest 4–8 relevant items from the catalog.
- If nothing matches a query, say so honestly and suggest the closest categories available.
- Currency is always Rwandan Franc (RWF). Orders are picked up at the customer's chosen Simba branch.

CATALOG (id|name|category|price|unit|stock):
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
