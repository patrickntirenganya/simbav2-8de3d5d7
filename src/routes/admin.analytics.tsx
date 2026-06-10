import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Download, Trophy, TrendingUp, Package, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Branch } from "@/lib/branches";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Branch analytics — Simba" }] }),
});

interface OrderItem { id: number; name: string; price: number; quantity: number }
interface OrderRow {
  id: string;
  branch_id: string;
  status: string;
  total: number;
  items: OrderItem[];
  created_at: string;
}

interface BranchStat {
  branch_id: string;
  name: string;
  revenue: number;
  orders: number;
  completed: number;
  cancelled: number;
  avgOrder: number;
  units: number;
}

const RANGE_DAYS: Record<string, number> = {
  this_week: 7,
  last_week: 14,
  last_30: 30,
  last_90: 90,
};

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ec4899", "#eab308", "#06b6d4", "#84cc16", "#f43f5e"];

function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useMyRoles();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [range, setRange] = useState<string>("this_week");
  const [branchFilter, setBranchFilter] = useState<string>("__all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/admin/analytics" } });
  }, [user, authLoading, navigate]);

  const { fromDate, toDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    const to = new Date(now);
    let from = new Date(now);
    let label = "";
    if (range === "this_week") {
      const day = now.getDay() || 7;
      from = new Date(now); from.setDate(now.getDate() - (day - 1)); from.setHours(0, 0, 0, 0);
      label = "This week";
    } else if (range === "last_week") {
      const day = now.getDay() || 7;
      from = new Date(now); from.setDate(now.getDate() - (day - 1) - 7); from.setHours(0, 0, 0, 0);
      const t = new Date(from); t.setDate(from.getDate() + 7);
      return { fromDate: from, toDate: t, rangeLabel: "Last week" };
    } else {
      from.setDate(now.getDate() - RANGE_DAYS[range]);
      label = `Last ${RANGE_DAYS[range]} days`;
    }
    return { fromDate: from, toDate: to, rangeLabel: label };
  }, [range]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      supabase.from("branches").select("*").order("name"),
      supabase
        .from("orders")
        .select("id, branch_id, status, total, items, created_at")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .limit(5000),
    ]).then(([{ data: b }, { data: o }]) => {
      setBranches((b ?? []) as Branch[]);
      setOrders((o ?? []) as unknown as OrderRow[]);
      setLoading(false);
    });
  }, [isAdmin, fromDate, toDate]);

  const filteredOrders = useMemo(
    () => branchFilter === "__all" ? orders : orders.filter((o) => o.branch_id === branchFilter),
    [orders, branchFilter],
  );

  // Per-branch aggregates
  const branchStats: BranchStat[] = useMemo(() => {
    const map = new Map<string, BranchStat>();
    for (const b of branches) {
      map.set(b.id, { branch_id: b.id, name: b.name, revenue: 0, orders: 0, completed: 0, cancelled: 0, avgOrder: 0, units: 0 });
    }
    for (const o of orders) {
      const s = map.get(o.branch_id);
      if (!s) continue;
      s.orders += 1;
      if (o.status === "picked_up") { s.revenue += Number(o.total) || 0; s.completed += 1; }
      if (o.status === "cancelled" || o.status === "no_show") s.cancelled += 1;
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) s.units += Number(it.quantity) || 0;
    }
    for (const s of map.values()) s.avgOrder = s.completed ? s.revenue / s.completed : 0;
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [branches, orders]);

  // Daily revenue trend
  const daily = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const o of filteredOrders) {
      if (o.status !== "picked_up") continue;
      const d = new Date(o.created_at).toISOString().slice(0, 10);
      buckets.set(d, (buckets.get(d) || 0) + (Number(o.total) || 0));
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date: date.slice(5), revenue }));
  }, [filteredOrders]);

  // Status distribution (filtered scope)
  const statusDist = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of filteredOrders) m.set(o.status, (m.get(o.status) || 0) + 1);
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top products
  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of filteredOrders) {
      if (o.status !== "picked_up") continue;
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const k = String(it.id);
        const cur = m.get(k) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity) || 0;
        cur.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0);
        m.set(k, cur);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredOrders]);

  const totals = useMemo(() => {
    const scope = branchFilter === "__all" ? branchStats : branchStats.filter((s) => s.branch_id === branchFilter);
    return scope.reduce(
      (a, s) => ({
        revenue: a.revenue + s.revenue,
        orders: a.orders + s.orders,
        completed: a.completed + s.completed,
        cancelled: a.cancelled + s.cancelled,
        units: a.units + s.units,
      }),
      { revenue: 0, orders: 0, completed: 0, cancelled: 0, units: 0 },
    );
  }, [branchStats, branchFilter]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = branchFilter === "__all"
      ? "Simba Supermarket — All Branches Performance Report"
      : `Simba Supermarket — ${branches.find((b) => b.id === branchFilter)?.name ?? ""} Performance Report`;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${rangeLabel} (${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()})`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 31);

    // Summary
    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Value"]],
      body: [
        ["Total revenue (picked up)", `${totals.revenue.toLocaleString()} RWF`],
        ["Total orders", String(totals.orders)],
        ["Completed (picked up)", String(totals.completed)],
        ["Cancelled / no-show", String(totals.cancelled)],
        ["Units sold", String(totals.units)],
        ["Avg revenue per completed order",
          `${(totals.completed ? totals.revenue / totals.completed : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} RWF`],
      ],
      headStyles: { fillColor: [249, 115, 22] },
      styles: { fontSize: 10 },
    });

    // Branch ranking (only for all-branches view)
    if (branchFilter === "__all") {
      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
        head: [["#", "Branch", "Revenue (RWF)", "Orders", "Completed", "Cancelled", "Avg order"]],
        body: branchStats.map((s, i) => [
          i + 1,
          s.name,
          s.revenue.toLocaleString(),
          s.orders,
          s.completed,
          s.cancelled,
          s.avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        ]),
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 9 },
      });
    }

    // Top products
    if (topProducts.length) {
      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
        head: [["#", "Product", "Units sold", "Revenue (RWF)"]],
        body: topProducts.map((p, i) => [i + 1, p.name, p.qty, p.revenue.toLocaleString()]),
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 9 },
      });
    }

    // Footer
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Simba Supermarket · Kigali, Rwanda · page ${i} of ${pageCount}`, 14, doc.internal.pageSize.getHeight() - 8);
    }

    const filename = `simba-report-${branchFilter === "__all" ? "all-branches" : (branches.find((b) => b.id === branchFilter)?.name ?? "branch").toLowerCase().replace(/\s+/g, "-")}-${range}.pdf`;
    doc.save(filename);
  };

  if (authLoading || rolesLoading) return null;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-black">Admin only</h1>
          <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
        </Button>

        <div className="flex flex-wrap items-end gap-4 mb-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl"><BarChart3 className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Branch performance</h1>
              <p className="text-xs text-muted-foreground">Revenue, orders, ranking and exportable PDF reports</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Period</p>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="last_week">Last week</SelectItem>
                  <SelectItem value="last_30">Last 30 days</SelectItem>
                  <SelectItem value="last_90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Branch</p>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportPDF} className="gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <KPI icon={<DollarSign className="w-4 h-4" />} label="Revenue" value={`${totals.revenue.toLocaleString()} RWF`} />
          <KPI icon={<Package className="w-4 h-4" />} label="Orders" value={String(totals.orders)} />
          <KPI icon={<TrendingUp className="w-4 h-4" />} label="Completed" value={String(totals.completed)} />
          <KPI icon={<Trophy className="w-4 h-4" />} label="Units sold" value={String(totals.units)} />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid gap-6">
            {/* Ranking + revenue bar chart */}
            {branchFilter === "__all" && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black">Branch ranking by revenue</h2>
                    <span className="text-xs text-muted-foreground">{rangeLabel}</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchStats}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()} RWF`} />
                        <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground border-b">
                        <tr>
                          <th className="text-left py-2 px-2">#</th>
                          <th className="text-left py-2 px-2">Branch</th>
                          <th className="text-right py-2 px-2">Revenue</th>
                          <th className="text-right py-2 px-2">Orders</th>
                          <th className="text-right py-2 px-2">Completed</th>
                          <th className="text-right py-2 px-2">Cancelled</th>
                          <th className="text-right py-2 px-2">Avg order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchStats.map((s, i) => (
                          <tr key={s.branch_id} className="border-b last:border-0">
                            <td className="py-2 px-2">
                              {i === 0 ? <Badge className="bg-yellow-500">🏆 1</Badge> : i === 1 ? <Badge variant="secondary">2</Badge> : i === 2 ? <Badge variant="secondary">3</Badge> : <span className="text-muted-foreground">{i + 1}</span>}
                            </td>
                            <td className="py-2 px-2 font-semibold">{s.name}</td>
                            <td className="py-2 px-2 text-right">{formatPrice(s.revenue, "EN")}</td>
                            <td className="py-2 px-2 text-right">{s.orders}</td>
                            <td className="py-2 px-2 text-right text-green-600">{s.completed}</td>
                            <td className="py-2 px-2 text-right text-red-600">{s.cancelled}</td>
                            <td className="py-2 px-2 text-right">{formatPrice(s.avgOrder, "EN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily trend */}
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-black mb-3">Daily revenue trend</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()} RWF`} />
                        <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status pie */}
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-black mb-3">Order status mix</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" nameKey="name" outerRadius={90} label>
                          {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top products */}
            <Card>
              <CardContent className="p-5">
                <h2 className="font-black mb-3">Top 10 products by revenue</h2>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed orders in this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground border-b">
                        <tr>
                          <th className="text-left py-2 px-2">#</th>
                          <th className="text-left py-2 px-2">Product</th>
                          <th className="text-right py-2 px-2">Units</th>
                          <th className="text-right py-2 px-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-2">{i + 1}</td>
                            <td className="py-2 px-2">{p.name}</td>
                            <td className="py-2 px-2 text-right">{p.qty}</td>
                            <td className="py-2 px-2 text-right">{formatPrice(p.revenue, "EN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
        <p className="text-xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}
