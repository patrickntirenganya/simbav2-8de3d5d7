import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/lib/products";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

type Search = { q?: string; category?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "All Products — Simba Supermarket" },
      {
        name: "description",
        content: "Browse all products by category, with search, filter and instant cart.",
      },
    ],
  }),
});

function ProductsPage() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const [sortBy, setSortBy] = useState<"popularity" | "lowToHigh" | "highToLow">("popularity");
  const { t } = useLanguage();

  const search = q ?? "";
  const setSearch = (v: string) =>
    navigate({ search: (prev) => ({ ...prev, q: v || undefined }) });
  const setCategory = (c: string | null) =>
    navigate({ search: (prev) => ({ ...prev, category: c ?? undefined }) });

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const ms =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase());
        const mc = !category || p.category === category;
        return ms && mc;
      })
      .sort((a, b) => {
        if (sortBy === "lowToHigh") return a.price - b.price;
        if (sortBy === "highToLow") return b.price - a.price;
        return 0;
      });
  }, [search, category, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header search={search} setSearch={setSearch} />

      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60 lg:flex-shrink-0">
          <h2 className="font-black text-xs uppercase tracking-widest mb-4 text-muted-foreground">
            {t.categories}
          </h2>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            <CategoryButton
              label={t.allProducts}
              active={!category}
              onClick={() => setCategory(null)}
            />
            {categories.map((c) => (
              <CategoryButton
                key={c}
                label={c}
                active={category === c}
                onClick={() => setCategory(c)}
              />
            ))}
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-black">
                {category ?? t.allProducts}
              </h1>
              <p className="text-sm text-muted-foreground">{filtered.length} products</p>
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">{t.popularity}</SelectItem>
                <SelectItem value="lowToHigh">{t.lowToHigh}</SelectItem>
                <SelectItem value="highToLow">{t.highToLow}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              No products match your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 lg:w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-card border hover:border-primary text-foreground",
      )}
    >
      {label}
    </button>
  );
}
