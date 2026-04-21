import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { products, categories } from "@/lib/products";

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
  const featured = products.slice(0, 8);
  const topCategories = categories.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-orange-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
                Freshness
                <br />
                Delivered to
                <br />
                <span className="text-yellow-300">Your Door.</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90 max-w-md">
                Shop Rwanda's best groceries, electronics, and daily essentials with instant MoMo
                checkout.
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

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Fast Delivery", desc: "Kigali within 2 hours" },
            { icon: ShieldCheck, title: "Secure Payment", desc: "MoMo & card supported" },
            { icon: Truck, title: "Free Shipping", desc: "On all orders today" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-4 p-5 bg-card rounded-2xl border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-black mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topCategories.map((cat) => (
              <Link
                key={cat}
                to="/products"
                search={{ q: undefined, category: cat }}
                className="p-4 bg-card border rounded-2xl text-center hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center text-primary font-black">
                  {cat[0]}
                </div>
                <p className="text-xs font-bold truncate">{cat}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Featured Products</h2>
            <Button asChild variant="ghost">
              <Link to="/products" search={{ q: undefined, category: undefined }}>
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <footer className="border-t mt-12 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Simba Supermarket — Kigali, Rwanda
        </footer>
      </main>
    </div>
  );
}
