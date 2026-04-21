import { useNavigate } from "@tanstack/react-router";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function CartSidebar() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, isCartOpen, closeCart } =
    useCart();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
    } else {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black">{t.cart}</SheetTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {totalItems} items
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={closeCart} aria-label="Close cart">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 py-16">
              <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 opacity-30" />
              </div>
              <p className="font-bold text-foreground">{t.emptyCart}</p>
              <Button onClick={closeCart} variant="default">
                {t.exploreProducts}
              </Button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 bg-card p-3 rounded-xl border"
              >
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                  <p className="text-primary font-black text-sm">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-muted rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-background rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-background rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-muted/30 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t.delivery}</span>
                <span className="text-green-600 font-black">{t.free}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-black">{t.total}</span>
                <span className="text-2xl font-black text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground text-center">{t.loginToCheckout}</p>
            )}
            <Button onClick={handleCheckout} size="lg" className="w-full font-black text-base">
              {t.checkout}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
