import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BranchReviewForm } from "@/components/BranchReviewForm";
import { formatPrice } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  total: number;
  status: OrderStatus;
  city: string;
  created_at: string;
  branch_id: string | null;
  pickup_time: string | null;
  items: Array<{ name: string; quantity: number; image: string; price: number }>;
}

interface BranchRow { id: string; name: string }

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders — Simba Supermarket" }] }),
});

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [branches, setBranches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/orders" } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ord }, { data: br }] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,city,created_at,branch_id,pickup_time,items")
          .order("created_at", { ascending: false }),
        supabase.from("branches").select("id,name"),
      ]);
      setOrders((ord as unknown as OrderRow[]) ?? []);
      const map: Record<string, string> = {};
      ((br as BranchRow[]) ?? []).forEach((b) => (map[b.id] = b.name));
      setBranches(map);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-black mb-6">{t.myOrders}</h1>

        {loading ? (
          <p className="text-muted-foreground">...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-semibold mb-2">{t.noOrders}</p>
              <p className="text-sm text-muted-foreground mb-4">{t.startShoppingDesc}</p>
              <Button asChild>
                <Link to="/products" search={{ q: undefined, category: undefined }}>
                  {t.browseProducts}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const canReview = o.status === "picked_up" && o.branch_id;
              const branchName = o.branch_id ? branches[o.branch_id] : undefined;
              return (
                <Card key={o.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="font-black">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                          {branchName && <> · {t.pickupAt} {branchName}</>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary">
                          {formatPrice(Number(o.total))}
                        </p>
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                            STATUS_TONE[o.status],
                          )}
                        >
                          {STATUS_LABEL[o.status]?.[lang] ?? o.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {o.items.slice(0, 6).map((it, idx) => (
                        <img
                          key={idx}
                          src={it.image}
                          alt={it.name}
                          title={`${it.name} x${it.quantity}`}
                          className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                        />
                      ))}
                      {o.items.length > 6 && (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                          +{o.items.length - 6}
                        </div>
                      )}
                    </div>

                    {canReview && (
                      <BranchReviewForm
                        orderId={o.id}
                        branchId={o.branch_id!}
                        branchName={branchName}
                      />
                    )}
                    {!canReview && o.status !== "cancelled" && o.branch_id && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t.rateBranchHint}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
