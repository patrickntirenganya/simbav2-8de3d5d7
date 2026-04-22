import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { CategorySidebar } from "@/components/CategorySidebar";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/products";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Simba Supermarket — Shop Groceries Online in Rwanda" },
      {
        name: "description",
        content:
          "Browse 780+ real products across food, electronics, cosmetics and more. Fast Kigali delivery, MoMo payment.",
      },
    ],
  }),
});

function HomePage() {
  const featured = products.slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero — Getir-style: solid brand colour band, bold headline, single CTA */}
        <section className="bg-gradient-to-br from-primary via-primary to-orange-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight mb-4 sm:mb-6">
                Groceries in
                <br />
                <span className="text-yellow-300">minutes.</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 max-w-md">
                Shop Rwanda's freshest groceries and essentials with instant MoMo checkout.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="font-black">
                  <Link to="/products" search={{ q: undefined, category: undefined }}>
                    Start Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
                alt="Fresh groceries"
                className="rounded-3xl shadow-2xl w-full h-80 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Main layout — Getir-style: left categories, right content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="lg:w-64 lg:flex-shrink-0">
            <CategorySidebar activeCategory={null} className="lg:sticky lg:top-20" />
          </div>

          <div className="flex-1 min-w-0 space-y-8">
            {/* Trust strip */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Zap, title: "Fast Delivery", desc: "Kigali within 2 hours" },
                { icon: ShieldCheck, title: "Secure Payment", desc: "MoMo & card supported" },
                { icon: Truck, title: "Free Shipping", desc: "On all orders today" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-3 p-4 bg-card rounded-2xl border"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Featured products */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-black">Featured Products</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/products" search={{ q: undefined, category: undefined }}>
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t mt-8 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Simba Supermarket — Kigali, Rwanda
        </footer>
      </main>
    </div>
  );
}
