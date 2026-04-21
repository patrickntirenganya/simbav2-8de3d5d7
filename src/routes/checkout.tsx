import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Simba Supermarket" }] }),
});

function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Kigali");
  const [momoPhone, setMomoPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && cart.length === 0) {
      // No items — bounce home
      navigate({ to: "/" });
    }
  }, [cart.length, user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const validateMomo = (p: string) => /^(\+?250)?7[2389]\d{7}$/.test(p.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMomo(momoPhone)) {
      toast.error("Enter a valid Rwandan MoMo number (e.g. 07XXXXXXXX)");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        momo_phone: momoPhone.trim(),
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          image: c.image,
        })),
        subtotal: totalPrice,
        delivery_fee: 0,
        total: totalPrice,
        status: "pending",
        notes: notes.trim() || null,
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order placed! MoMo prompt simulated.");
    clearCart();
    navigate({ to: "/orders" });
    void data;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Continue shopping
          </Link>
        </Button>

        <h1 className="text-3xl font-black mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-black text-lg">Delivery details</h2>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required maxLength={50} value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, sector, KK ave..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order notes (optional)</Label>
                  <Textarea id="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg">Mobile Money (MoMo)</h2>
                    <p className="text-xs text-muted-foreground">MTN MoMo · Airtel Money</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="momoPhone">MoMo phone number</Label>
                  <Input
                    id="momoPhone"
                    required
                    inputMode="tel"
                    maxLength={20}
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    A payment prompt will be sent to this number.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-black text-lg">Order summary</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((i) => (
                    <div key={i.id} className="flex gap-3 text-sm">
                      <img src={i.image} alt={i.name} className="w-12 h-12 rounded-lg object-cover bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{i.name}</p>
                        <p className="text-xs text-muted-foreground">x{i.quantity}</p>
                      </div>
                      <p className="font-black text-sm">{formatPrice(i.price * i.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className="text-green-600 font-black">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-black">Total</span>
                    <span className="text-xl font-black text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <Button type="submit" disabled={submitting || cart.length === 0} size="lg" className="w-full font-black">
                  {submitting ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
