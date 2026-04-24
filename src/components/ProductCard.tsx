import { Link } from "@tanstack/react-router";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const { t, trProductName, trCategory } = useLanguage();
  const cartItem = cart.find((i) => i.id === product.id);
  const displayName = trProductName(product.id, product.name);
  const displayCat = trCategory(product.category);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${displayName} +1`, { id: `add-${product.id}` });
  };

  return (
    <div className="group bg-card rounded-2xl border p-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link
        to="/products/$id"
        params={{ id: String(product.id) }}
        className="block"
      >
        <div className="relative aspect-square rounded-xl bg-muted mb-3 overflow-hidden">
          <img
            src={product.image}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="space-y-1 flex-1">
        <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
          {displayCat}
        </span>
        <Link to="/products/$id" params={{ id: String(product.id) }}>
          <h3 className="font-bold text-sm leading-tight truncate hover:text-primary transition-colors">
            {displayName}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-base font-black">{formatPrice(product.price)}</p>
          <span className="text-[10px] text-muted-foreground">{product.unit}</span>
        </div>
      </div>

      <div className="mt-3">
        {cartItem ? (
          <div className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-xl overflow-hidden">
            <button
              onClick={() => updateQuantity(product.id, -1)}
              className="p-2 hover:bg-primary/80 flex-1 flex justify-center"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-black text-sm">{cartItem.quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, 1)}
              className="p-2 hover:bg-primary/80 flex-1 flex justify-center"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-background text-primary border-2 border-primary rounded-xl text-xs font-black hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Plus className="w-3 h-3" />
            {t.addToCart}
          </button>
        )}
      </div>
    </div>
  );
}
