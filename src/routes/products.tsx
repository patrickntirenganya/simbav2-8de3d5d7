import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { CategorySidebar } from "@/components/CategorySidebar";
import { products } from "@/lib/products";
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
  const { t, trCategory, trProductName } = useLanguage();

  const search = q ?? "";
  const setSearch = (v: string) =>
    navigate({ search: (prev: Search) => ({ ...prev, q: v || undefined }) });

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return products
      .filter((p) => {
        const nameTr = trProductName(p.id, p.name).toLowerCase();
        const catTr = trCategory(p.category).toLowerCase();
        const ms =
          !search ||
          p.name.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower) ||
          nameTr.includes(lower) ||
          catTr.includes(lower);
        const mc = !category || p.category === category;
        return ms && mc;
      })
      .sort((a, b) => {
        if (sortBy === "lowToHigh") return a.price - b.price;
        if (sortBy === "highToLow") return b.price - a.price;
        return 0;
      });
  }, [search, category, sortBy, trProductName, trCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header search={search} setSearch={setSearch} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="lg:w-64 lg:flex-shrink-0">
          <CategorySidebar activeCategory={category ?? null} className="lg:sticky lg:top-20" />
        </div>

        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-2xl font-black">
                {category ? trCategory(category) : t.allProducts}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filtered.length} {t.productsFound}
              </p>
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
              {t.noProducts}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
