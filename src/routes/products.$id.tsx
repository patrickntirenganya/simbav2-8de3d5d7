import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductById, products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/format";
import { buildProductDescription } from "@/lib/productDescription";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = getProductById(Number(params.id));
    if (!product) throw notFound();
    return { product };
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button asChild>
          <Link to="/products" search={{ q: undefined, category: undefined }}>
            Browse products
          </Link>
        </Button>
      </div>
    </div>
  ),
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.product.name} — Simba Supermarket` },
            {
              name: "description",
              content: `${loaderData.product.name} — ${formatPrice(loaderData.product.price)} in ${loaderData.product.category}`,
            },
            { property: "og:image", content: loaderData.product.image },
            { property: "og:title", content: loaderData.product.name },
          ],
        }
      : {},
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { cart, addToCart, updateQuantity } = useCart();
  const { t, trProductName, trCategory } = useLanguage();
  const cartItem = cart.find((i) => i.id === product.id);
  const displayName = trProductName(product.id, product.name);
  const displayCat = trCategory(product.category);

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const desc = buildProductDescription(product);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/products" search={{ q: undefined, category: product.category }}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.backToShop}
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-3xl overflow-hidden border aspect-square">
            <img src={product.image} alt={displayName} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded inline-block w-fit mb-3">
              {displayCat}
            </span>
            <h1 className="text-3xl md:text-4xl font-black mb-3">{displayName}</h1>
            <p className="text-sm text-muted-foreground mb-2">{product.unit}</p>
            <p className="text-4xl font-black text-primary mb-6">{formatPrice(product.price)}</p>

            <div className="flex items-center gap-2 mb-6">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                  product.inStock
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {product.inStock ? t.inStock : t.outOfStock}
              </span>
            </div>

            {cartItem ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-primary text-primary-foreground rounded-xl">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="p-3 hover:bg-primary/80 rounded-l-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="p-3 hover:bg-primary/80 rounded-r-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="font-black text-base"
                disabled={!product.inStock}
                onClick={() => {
                  addToCart(product);
                  toast.success(`${displayName} +1`);
                }}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t.addToCart}
              </Button>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black mb-6">{t.recommended}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
