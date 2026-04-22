import { Link } from "@tanstack/react-router";
import { categories, categoryImages } from "@/lib/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  activeCategory?: string | null;
  className?: string;
}

/**
 * Getir-style left vertical category list.
 * Each row: thumbnail image + category name. Active row highlighted in primary.
 */
export function CategorySidebar({ activeCategory = null, className }: CategorySidebarProps) {
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "bg-card border rounded-2xl overflow-hidden shadow-sm",
        className,
      )}
    >
      <div className="px-4 py-3 border-b bg-muted/40">
        <h2 className="font-black text-sm uppercase tracking-wider text-primary">
          {t.categories}
        </h2>
      </div>
      <nav className="max-h-[70vh] overflow-y-auto">
        <Link
          to="/products"
          search={{ q: undefined, category: undefined }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-l-4 transition-all hover:bg-muted/60",
            !activeCategory
              ? "border-primary bg-primary/5 text-primary"
              : "border-transparent text-foreground",
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
            ALL
          </div>
          <span className="truncate">{t.allProducts}</span>
        </Link>

        {categories.map((cat) => {
          const active = activeCategory === cat;
          const img = categoryImages[cat];
          return (
            <Link
              key={cat}
              to="/products"
              search={{ q: undefined, category: cat }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-l-4 transition-all hover:bg-muted/60",
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-foreground",
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                {img ? (
                  <img
                    src={img}
                    alt={cat}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-black">
                    {cat[0]}
                  </div>
                )}
              </div>
              <span className="truncate leading-tight">{cat}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
