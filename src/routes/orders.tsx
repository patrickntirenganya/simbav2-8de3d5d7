import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

interface OrderRow {
  id: string;
  total: number;
  status: string;
  city: string;
  created_at: string;
  items: Array<{ name: string; quantity: number; image: string; price: number }>;
}

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders — Simba Supermarket" }] }),
});

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/orders" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id,total,status,city,created_at,items")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
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
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="font-black">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()} · {o.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary">{formatPrice(Number(o.total))}</p>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {o.status}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
