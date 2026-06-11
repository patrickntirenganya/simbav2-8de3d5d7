import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Smartphone, Clock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BranchSelector } from "@/components/BranchSelector";
import { PaymentDialog, type PaymentMethod } from "@/components/PaymentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { PICKUP_DEPOSIT_RWF, formatSlot, generatePickupSlots } from "@/lib/branches";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Simba Supermarket" }] }),
});

function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn_momo");
  const [momoPhone, setMomoPhone] = useState("");
  const [airtelPhone, setAirtelPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const slots = useMemo(() => generatePickupSlots(), []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && cart.length === 0) {
      navigate({ to: "/" });
    }
  }, [cart.length, user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const validatePhone = (p: string) => /^(\+?250)?7[2389]\d{7}$/.test(p.replace(/\s/g, ""));
  const validateCard = () => {
    const digits = cardNumber.replace(/\s/g, "");
    return (
      /^\d{13,19}$/.test(digits) &&
      /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(cardExpiry.trim()) &&
      /^\d{3,4}$/.test(cardCvv.trim()) &&
      cardName.trim().length > 1
    );
  };

  const paymentValid =
    (paymentMethod === "mtn_momo" && validatePhone(momoPhone)) ||
    (paymentMethod === "airtel_money" && validatePhone(airtelPhone)) ||
    (paymentMethod === "card" && validateCard());

  const canSubmit =
    !!branchId &&
    !!pickupTime &&
    fullName.trim().length > 1 &&
    phone.trim().length >= 9 &&
    paymentValid &&
    cart.length > 0;

  const paymentReference =
    paymentMethod === "mtn_momo"
      ? momoPhone
      : paymentMethod === "airtel_money"
        ? airtelPhone
        : `•••• ${cardNumber.replace(/\s/g, "").slice(-4)}`;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !pickupTime) {
      toast.error(t.selectBranch);
      return;
    }
    if (cart.length === 0) {
      toast.error(t.minOrder);
      return;
    }
    if (!paymentValid) {
      toast.error("Please complete your payment details");
      return;
    }
    setPayOpen(true);
  };

  const handleConfirmedPayment = async () => {
    setSubmitting(true);
    const momoRef =
      paymentMethod === "mtn_momo"
        ? momoPhone.trim()
        : paymentMethod === "airtel_money"
          ? airtelPhone.trim()
          : `CARD-${cardNumber.replace(/\s/g, "").slice(-4)}`;

    const { error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        branch_id: branchId!,
        pickup_time: pickupTime!,
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: "Pick-up at branch",
        city: "Kigali",
        momo_phone: momoRef,
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
        deposit_amount: PICKUP_DEPOSIT_RWF,
        deposit_paid: true,
        status: "pending",
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    setSubmitting(false);
    setPayOpen(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.orderPlaced, { description: t.orderPlacedDesc });
    clearCart();
    navigate({ to: "/orders" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.continueShopping}
          </Link>
        </Button>

        <h1 className="text-3xl font-black mb-6">{t.checkout}</h1>

        <form onSubmit={handleStartPayment} className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <BranchSelector value={branchId} onChange={setBranchId} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-base">{t.chooseTime}</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {slots.map((s) => {
                    const iso = s.toISOString();
                    const active = pickupTime === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setPickupTime(iso)}
                        className={cn(
                          "shrink-0 px-3 py-2 rounded-xl border-2 text-xs font-semibold whitespace-nowrap transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/60",
                        )}
                      >
                        {formatSlot(s, lang)}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-black text-lg">{t.yourDetails}</h2>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input id="fullName" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phoneNumber}</Label>
                  <Input id="phone" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t.notesOptional}</Label>
                  <Textarea id="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} />
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
                    <h2 className="font-black text-lg">Payment method</h2>
                    <p className="text-xs text-muted-foreground">Choose how you want to pay</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
                    { id: "airtel_money", label: "Airtel Money", icon: Smartphone },
                    { id: "card", label: "Card", icon: CreditCard },
                  ] as const).map((m) => {
                    const active = paymentMethod === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "mtn_momo" && (
                  <div className="space-y-2">
                    <Label htmlFor="momoPhone">MTN MoMo number</Label>
                    <Input
                      id="momoPhone"
                      required
                      inputMode="tel"
                      maxLength={20}
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                )}

                {paymentMethod === "airtel_money" && (
                  <div className="space-y-2">
                    <Label htmlFor="airtelPhone">Airtel Money number</Label>
                    <Input
                      id="airtelPhone"
                      required
                      inputMode="tel"
                      maxLength={20}
                      value={airtelPhone}
                      onChange={(e) => setAirtelPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on card</Label>
                      <Input id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="J. DOE" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card number</Label>
                      <Input
                        id="cardNumber"
                        inputMode="numeric"
                        maxLength={23}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ""))}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                        <Input id="cardExpiry" maxLength={7} value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/27" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input id="cardCvv" inputMode="numeric" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Payments are simulated — no real money is moved in this demo.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-black text-lg">{t.orderSummary}</h2>
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
                    <span>{t.subtotalLabel}</span>
                    <span className="text-foreground font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.deposit}</span>
                    <span className="text-primary font-black">{formatPrice(PICKUP_DEPOSIT_RWF)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {t.depositExplain}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-black">{t.payNow}</span>
                    <span className="text-xl font-black text-primary">{formatPrice(PICKUP_DEPOSIT_RWF)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  size="lg"
                  className="w-full font-black"
                >
                  {submitting ? t.processing : `${t.payDeposit} · ${formatPrice(PICKUP_DEPOSIT_RWF)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        <MoMoDepositDialog
          open={momoOpen}
          onOpenChange={setMomoOpen}
          amount={PICKUP_DEPOSIT_RWF}
          momoPhone={momoPhone}
          onConfirmed={handleConfirmedPayment}
        />
      </main>
    </div>
  );
}
