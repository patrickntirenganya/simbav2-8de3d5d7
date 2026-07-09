import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface OrderRow {
  id: string;
  full_name: string;
  phone: string;
  momo_phone: string;
  pickup_time: string | null;
  branch_id: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  total: number;
  deposit_amount: number;
  created_at: string;
  status: string;
}

export const Route = createFileRoute("/receipt/$id")({
  component: ReceiptPage,
  head: () => ({ meta: [{ title: "Receipt — Simba Supermarket" }] }),
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: `/receipt/${id}` } });
  }, [authLoading, user, id, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,full_name,phone,momo_phone,pickup_time,branch_id,items,subtotal,total,deposit_amount,created_at,status")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setOrder(data as unknown as OrderRow);
        if (data.branch_id) {
          const { data: b } = await supabase.from("branches").select("name,address").eq("id", data.branch_id).maybeSingle();
          if (b) setBranchName(`${b.name} — ${b.address}`);
        }
      }
      setLoading(false);
    })();
  }, [id, user]);

  if (!user || loading) return <div className="p-10 text-center text-muted-foreground">Loading receipt…</div>;
  if (!order) return <div className="p-10 text-center">Receipt not found.</div>;

  const short = order.id.slice(0, 8).toUpperCase();
  const created = new Date(order.created_at);

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* on-screen controls — hidden when printing */}
      <div className="max-w-md mx-auto mb-4 flex justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/orders">
            <ArrowLeft className="w-4 h-4 mr-1" />
            My orders
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()} className="font-bold">
          <Printer className="w-4 h-4 mr-1" />
          Print receipt
        </Button>
      </div>

      {/* Receipt paper — narrow, monospace, thermal-printer style */}
      <div
        className="mx-auto bg-white text-black shadow-lg print:shadow-none border border-dashed border-gray-300 print:border-0"
        style={{ width: "80mm", padding: "10mm 6mm", fontFamily: "'Courier New', ui-monospace, monospace" }}
      >
        <div className="text-center mb-3">
          <div className="text-xl font-black tracking-widest">SIMBA</div>
          <div className="text-[10px] uppercase tracking-wider">Supermarket · Kigali</div>
          <div className="text-[10px] mt-1">simba.rw · +250 788 000 000</div>
        </div>

        <div className="border-t border-b border-dashed border-black py-2 my-2 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto text-green-700 print:text-black" />
          <div className="text-xs font-bold mt-1">PAYMENT CONFIRMED</div>
        </div>

        <div className="text-[11px] space-y-0.5 mb-2">
          <div className="flex justify-between"><span>Receipt #</span><span className="font-bold">{short}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{created.toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span>Time</span><span>{created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
          <div className="flex justify-between"><span>Customer</span><span className="truncate max-w-[40mm]">{order.full_name}</span></div>
          <div className="flex justify-between"><span>Phone</span><span>{order.phone}</span></div>
          <div className="flex justify-between"><span>Paid via</span><span>{order.momo_phone}</span></div>
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-2">
          <div className="text-[11px] font-bold mb-1">ITEMS</div>
          {order.items.map((it, idx) => (
            <div key={idx} className="text-[11px] mb-1">
              <div className="truncate">{it.name}</div>
              <div className="flex justify-between">
                <span>{it.quantity} × {formatPrice(it.price)}</span>
                <span className="font-bold">{formatPrice(it.price * it.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 text-[11px] space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Deposit paid</span><span>{formatPrice(order.deposit_amount)}</span></div>
          <div className="flex justify-between"><span>Balance at pickup</span><span>{formatPrice(Number(order.total) - Number(order.deposit_amount))}</span></div>
          <div className="flex justify-between font-black text-sm border-t border-black mt-1 pt-1">
            <span>TOTAL</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {order.pickup_time && (
          <div className="mt-3 border border-black p-2 text-[11px] text-center">
            <div className="font-bold">PICK-UP</div>
            <div>{new Date(order.pickup_time).toLocaleString()}</div>
            {branchName && <div className="mt-1">{branchName}</div>}
          </div>
        )}

        <div className="text-center mt-4 text-[10px]">
          <div>Thank you for shopping at Simba!</div>
          <div className="mt-1">Murakoze cyane · Merci</div>
          <div className="mt-2 tracking-[0.3em]">* * *</div>
        </div>
      </div>
    </div>
  );
}
