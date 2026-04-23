import * as React from "react";
import { Sparkles, Send, X, Loader2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const CATALOG = products.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  category: p.category,
  unit: p.unit,
}));

const SUGGESTIONS = [
  "I need breakfast items",
  "What's good for dinner tonight?",
  "Show me cheap rice options",
  "Baby food under 5000 RWF",
];

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function AIAssistant() {
  const { lang } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm Simba — your AI shopping assistant. Ask me anything: meal ideas, products, prices, or what's good for breakfast!",
    },
  ]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== messages[messages.length - 1]?.content) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          catalog: CATALOG,
          lang,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        upsert(
          resp.status === 429
            ? "I'm getting too many requests right now. Please try again in a moment."
            : resp.status === 402
              ? "AI credits are exhausted. Please add credits to continue."
              : `Sorry, something went wrong. ${errText}`,
        );
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      upsert("Sorry, I couldn't reach the AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const findMentionedProducts = (text: string) => {
    const lower = text.toLowerCase();
    const found: typeof products = [];
    for (const p of products) {
      if (found.length >= 6) break;
      if (lower.includes(p.name.toLowerCase())) found.push(p);
    }
    return found;
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 group flex items-center gap-2 bg-primary text-primary-foreground pl-3 pr-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform"
          aria-label="Open Simba AI assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-sm hidden sm:inline">Ask Simba AI</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[400px] sm:h-[600px] bg-background sm:border sm:rounded-2xl shadow-2xl flex flex-col">
          <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-4 flex items-center justify-between sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">Simba AI</p>
                <p className="text-[11px] text-white/80">Your shopping assistant</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((m, i) => {
                const mentioned = m.role === "assistant" ? findMentionedProducts(m.content) : [];
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col gap-2",
                      m.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm",
                      )}
                    >
                      {m.content}
                    </div>
                    {mentioned.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-w-full">
                        {mentioned.map((p) => (
                          <Link
                            key={p.id}
                            to="/products/$id"
                            params={{ id: String(p.id) }}
                            className="flex items-center gap-2 bg-card border rounded-xl p-2 hover:border-primary transition-colors max-w-[180px]"
                            onClick={() => setOpen(false)}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold truncate">{p.name}</p>
                              <p className="text-[11px] font-black text-primary">
                                {formatPrice(p.price)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> thinking...
                </div>
              )}
              {messages.length === 1 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase text-muted-foreground mb-2">
                    Try asking
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-xs bg-muted hover:bg-accent px-3 py-2 rounded-xl flex items-center gap-2"
                      >
                        <ShoppingBag className="w-3 h-3 text-primary" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about products..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
