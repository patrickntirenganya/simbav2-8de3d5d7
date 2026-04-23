import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BranchReviewForm } from "@/components/BranchReviewForm";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  total: number;
  status: string;
  city: string;
  created_at: string;
  branch_id: string | null;
  pickup_time: string | null;
  items: Array<{ name: string; quantity: number; image: string; price: number }>;
}

interface BranchRow {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  picked_up: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders — Simba Supermarket" }] }),
});

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [branches, setBranches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/orders" } });
    }
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
      setOrders((ord as OrderRow[]) ?? []);
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
        <h1 className="text-3xl font-black mb-6">My Orders</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-semibold mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start shopping to see your orders here.
              </p>
              <Button asChild>
                <Link to="/products" search={{ q: undefined, category: undefined }}>
                  Browse products
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
                        <p className="font-black">Order #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                          {branchName && <> · Pick-up at {branchName}</>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary">
                          {formatPrice(Number(o.total))}
                        </p>
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                            STATUS_COLORS[o.status] ?? "bg-muted text-foreground",
                          )}
                        >
                          {o.status.replace("_", " ")}
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
                        <Star className="w-3 h-3" /> You can rate this branch once your order is
                        picked up.
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
