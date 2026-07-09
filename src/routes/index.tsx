import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, ShieldCheck, Store, ArrowRight, Star, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { products, categories, categoryImages } from "@/lib/products";

const KIGALI_BRANCHES = [
  "Remera", "Kimironko", "Kacyiru", "Nyamirambo",
  "Gikondo", "Kanombe", "Kinyinya", "Kibagabaga", "Nyanza",
];

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Simba Supermarket — Rwanda's #1 Online Grocery" },
      {
        name: "description",
        content:
          "Shop Rwanda's freshest groceries with instant MoMo checkout. Pick-up at 9 Kigali branches. 780+ products, AI shopping assistant.",
      },
      { property: "og:title", content: "Simba Supermarket — Rwanda's #1 Online Grocery" },
      {
        property: "og:description",
        content: "Shop Rwanda's freshest groceries. Pick-up in 60 min. MoMo payment.",
      },
    ],
  }),
});

function HomePage() {
  const { t } = useLanguage();
  const featured = products.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* ============== HERO with rotating photo slideshow ============== */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <HeroSlideshow />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />

          <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                <MapPin className="w-3 h-3" /> {t.location}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05] mb-5">
                {t.heroTitleA}{" "}
                <span className="text-primary">{t.heroTitleB}</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-8 text-white/85 max-w-lg leading-relaxed">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="font-black text-base h-12 px-6 shadow-2xl shadow-primary/40">
                  <Link to="/products" search={{ q: undefined, category: undefined }}>
                    {t.startShopping}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 font-bold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link to="/auth" search={{ redirect: undefined, mode: "signup" }}>
                    {t.signUp}
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-10 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex -space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-white/80">{t.trustedBy}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== Value props ============== */}
        <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Zap, title: t.fastDelivery, desc: t.fastDeliveryDesc },
              { icon: ShieldCheck, title: t.securePayment, desc: t.securePaymentDesc },
              { icon: Store, title: t.convenientPickup, desc: t.convenientPickupDesc },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3 p-4 bg-card rounded-2xl border shadow-lg"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-sm">{f.title}</h4>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============== Category carousel ============== */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-black">{t.shopByCategory}</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/products" search={{ q: undefined, category: undefined }}>
                {t.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`section ::-webkit-scrollbar{display:none}`}</style>
            {categories.map((cat) => {
              const img = categoryImages[cat];
              return (
                <Link
                  key={cat}
                  to="/products"
                  search={{ q: undefined, category: cat }}
                  className="snap-start shrink-0 w-36 sm:w-44 group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:scale-[1.03]"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={cat}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-black text-sm leading-tight drop-shadow-lg">
                      {cat}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============== Featured products ============== */}
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-black">{t.featuredProducts}</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/products" search={{ q: undefined, category: undefined }}>
                {t.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ============== Branch trust strip ============== */}
        <section className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-black mb-2">{t.ourBranches}</h2>
            <p className="text-white/70 text-sm mb-6">9 Kigali · {t.location}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {KIGALI_BRANCHES.map((b) => (
                <span
                  key={b}
                  className="px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-sm font-bold"
                >
                  Simba {b}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
