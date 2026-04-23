import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, ClipboardList, Package2, CheckCircle2, Clock, UserCheck, Flag, Boxes } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import type { Branch } from "@/lib/branches";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orderStatus";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/staff")({
  component: StaffPage,
  head: () => ({ meta: [{ title: "Branch dashboard — Simba" }] }),
});

interface OrderItem { id: number; name: string; price: number; quantity: number; image: string }
interface OrderRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  momo_phone: string;
  branch_id: string;
  pickup_time: string | null;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
  assigned_to: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
}
interface StaffMember { user_id: string }
interface InventoryRow { id: string; product_id: number; stock: number; in_stock: boolean }

function StaffPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const { isAdmin, isManager, isStaff, myBranchId, hasStaffAccess, loading: rolesLoading } = useMyRoles();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"orders" | "inventory">("orders");
  const [flagOrder, setFlagOrder] = useState<OrderRow | null>(null);
  const [flagReason, setFlagReason] = useState("no_show");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/staff" } });
  }, [user, authLoading, navigate]);

  // Determine which branch to show
  useEffect(() => {
    if (rolesLoading) return;
    if (isAdmin) {
      // load all branches, default to first
      supabase.from("branches").select("*").order("name").then(({ data }) => {
        const list = (data ?? []) as Branch[];
        setBranches(list);
        if (!activeBranchId && list.length) setActiveBranchId(list[0].id);
      });
    } else if (myBranchId) {
      supabase.from("branches").select("*").eq("id", myBranchId).then(({ data }) => {
        setBranches((data ?? []) as Branch[]);
        setActiveBranchId(myBranchId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, isAdmin, myBranchId]);

  const loadOrders = useCallback(async () => {
    if (!activeBranchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("branch_id", activeBranchId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setOrders((data ?? []) as unknown as OrderRow[]);
    setLoading(false);
  }, [activeBranchId]);

  const loadStaff = useCallback(async () => {
    if (!activeBranchId) return;
    const { data } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("branch_id", activeBranchId)
      .in("role", ["branch_staff", "branch_manager"]);
    setStaffList((data ?? []) as StaffMember[]);
  }, [activeBranchId]);

  useEffect(() => {
    if (activeBranchId) {
      loadOrders();
      loadStaff();
    }
  }, [activeBranchId, loadOrders, loadStaff]);

  // Realtime updates
  useEffect(() => {
    if (!activeBranchId) return;
    const ch = supabase
      .channel(`branch-orders-${activeBranchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `branch_id=eq.${activeBranchId}` }, () => {
        loadOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeBranchId, loadOrders]);

  if (authLoading || rolesLoading) return null;
  if (!user) return null;
  if (!hasStaffAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-black">Staff access only</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You need branch staff or manager permissions to view this dashboard. Ask your admin to grant access.
          </p>
          <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
        </main>
      </div>
    );
  }

  const updateOrder = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    loadOrders();
  };

  const acceptAndDecrement = async (o: OrderRow) => {
    // Decrement inventory atomically per item
    for (const item of o.items) {
      const { data: inv } = await supabase
        .from("branch_inventory")
        .select("id, stock")
        .eq("branch_id", o.branch_id)
        .eq("product_id", item.id)
        .maybeSingle();
      if (inv) {
        const next = Math.max(0, (inv.stock ?? 0) - item.quantity);
        await supabase
          .from("branch_inventory")
          .update({ stock: next, in_stock: next > 0 })
          .eq("id", inv.id);
      }
    }
    await updateOrder(o.id, { status: "accepted", accepted_at: new Date().toISOString() });
  };

  const buckets: Record<string, OrderRow[]> = {
    new: orders.filter((o) => o.status === "pending"),
    active: orders.filter((o) => ["accepted", "preparing"].includes(o.status)),
    ready: orders.filter((o) => o.status === "ready"),
    done: orders.filter((o) => ["picked_up", "cancelled"].includes(o.status)),
  };

  const submitFlag = async () => {
    if (!flagOrder) return;
    const { error } = await supabase.from("customer_flags").insert({
      branch_id: flagOrder.branch_id,
      customer_id: flagOrder.user_id,
      flagged_by: user.id,
      order_id: flagOrder.id,
      reason: flagReason || "no_show",
    });
    if (error) return toast.error(error.message);
    toast.success("Customer flagged");
    setFlagOrder(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Home</Link>
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl"><ClipboardList className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Branch dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Admin · all branches" : isManager ? "Manager view" : "Staff view"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && branches.length > 1 && (
              <Select value={activeBranchId ?? ""} onValueChange={setActiveBranchId}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={loadOrders}>
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "orders" | "inventory")}>
          <TabsList>
            <TabsTrigger value="orders"><Package2 className="w-4 h-4 mr-1" />Orders</TabsTrigger>
            <TabsTrigger value="inventory"><Boxes className="w-4 h-4 mr-1" />Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            {loading && orders.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">Loading...</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Bucket title="New" tone="amber" orders={buckets.new}>
                  {buckets.new.map((o) => (
                    <OrderCard
                      key={o.id} order={o} lang={lang}
                      staff={staffList}
                      canManage={isAdmin || isManager}
                      isStaffSelf={isStaff && !isManager && !isAdmin}
                      currentUserId={user.id}
                      onAccept={() => acceptAndDecrement(o)}
                      onAssign={(uid) => updateOrder(o.id, { assigned_to: uid } as Partial<OrderRow>)}
                      onStatus={(s) => updateOrder(o.id, statusPatch(s))}
                      onFlag={() => setFlagOrder(o)}
                    />
                  ))}
                </Bucket>
                <Bucket title="Preparing" tone="indigo" orders={buckets.active}>
                  {buckets.active.map((o) => (
                    <OrderCard key={o.id} order={o} lang={lang} staff={staffList}
                      canManage={isAdmin || isManager}
                      isStaffSelf={isStaff && !isManager && !isAdmin}
                      currentUserId={user.id}
                      onAssign={(uid) => updateOrder(o.id, { assigned_to: uid } as Partial<OrderRow>)}
                      onStatus={(s) => updateOrder(o.id, statusPatch(s))}
                      onFlag={() => setFlagOrder(o)} />
                  ))}
                </Bucket>
                <Bucket title="Ready for pick-up" tone="green" orders={buckets.ready}>
                  {buckets.ready.map((o) => (
                    <OrderCard key={o.id} order={o} lang={lang} staff={staffList}
                      canManage={isAdmin || isManager}
                      isStaffSelf={isStaff && !isManager && !isAdmin}
                      currentUserId={user.id}
                      onAssign={(uid) => updateOrder(o.id, { assigned_to: uid } as Partial<OrderRow>)}
                      onStatus={(s) => updateOrder(o.id, statusPatch(s))}
                      onFlag={() => setFlagOrder(o)} />
                  ))}
                </Bucket>
                <Bucket title="Completed" tone="emerald" orders={buckets.done}>
                  {buckets.done.map((o) => (
                    <OrderCard key={o.id} order={o} lang={lang} staff={staffList}
                      canManage={isAdmin || isManager}
                      isStaffSelf={isStaff && !isManager && !isAdmin}
                      currentUserId={user.id}
                      onAssign={(uid) => updateOrder(o.id, { assigned_to: uid } as Partial<OrderRow>)}
                      onStatus={(s) => updateOrder(o.id, statusPatch(s))}
                      onFlag={() => setFlagOrder(o)} />
                  ))}
                </Bucket>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            {activeBranchId && <InventoryPanel branchId={activeBranchId} />}
          </TabsContent>
        </Tabs>

        <Dialog open={!!flagOrder} onOpenChange={(o) => !o && setFlagOrder(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Flag customer</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Flag {flagOrder?.full_name} for this order. Repeated flags increase their deposit.
            </p>
            <Select value={flagReason} onValueChange={setFlagReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_show">Did not show up</SelectItem>
                <SelectItem value="late">Very late pick-up</SelectItem>
                <SelectItem value="rude">Rude behavior</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setFlagOrder(null)}>Cancel</Button>
              <Button onClick={submitFlag}>Flag customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function statusPatch(s: OrderStatus): Record<string, unknown> {
  const now = new Date().toISOString();
  if (s === "ready") return { status: s, ready_at: now };
  if (s === "picked_up") return { status: s, picked_up_at: now };
  return { status: s };
}

function Bucket({ title, tone, orders, children }: { title: string; tone: string; orders: OrderRow[]; children: React.ReactNode }) {
  const toneMap: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/30",
    indigo: "bg-indigo-500/10 border-indigo-500/30",
    green: "bg-green-500/10 border-green-500/30",
    emerald: "bg-emerald-500/10 border-emerald-500/30",
  };
  return (
    <div className={`rounded-2xl border-2 p-3 min-h-40 ${toneMap[tone] ?? ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-black text-sm uppercase tracking-wide">{title}</h3>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface OrderCardProps {
  order: OrderRow;
  lang: "EN" | "FR" | "RW";
  staff: StaffMember[];
  canManage: boolean;
  isStaffSelf: boolean;
  currentUserId: string;
  onAccept?: () => void;
  onAssign: (uid: string) => void;
  onStatus: (s: OrderStatus) => void;
  onFlag: () => void;
}

function OrderCard({ order: o, lang, staff, canManage, isStaffSelf, currentUserId, onAccept, onAssign, onStatus, onFlag }: OrderCardProps) {
  const [open, setOpen] = useState(false);
  const pickup = o.pickup_time ? new Date(o.pickup_time) : null;
  const mineOnly = isStaffSelf && o.assigned_to !== currentUserId;
  return (
    <Card className="bg-background">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm truncate">{o.full_name}</p>
            <p className="text-[11px] text-muted-foreground">{o.phone}</p>
          </div>
          <Badge className={STATUS_TONE[o.status]} variant="secondary">
            {STATUS_LABEL[o.status][lang]}
          </Badge>
        </div>

        {pickup && (
          <p className="text-[11px] flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {pickup.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
          </p>
        )}

        <div className="text-xs">
          <span className="font-semibold">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</span>
          {" · "}
          <span className="text-muted-foreground">{formatPrice(o.total)}</span>
        </div>

        {open && (
          <div className="space-y-1 text-xs border-t pt-2">
            {o.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="truncate">{i.quantity}× {i.name}</span>
                <span className="text-muted-foreground shrink-0">{formatPrice(i.price * i.quantity)}</span>
              </div>
            ))}
            {o.notes && <p className="text-[11px] italic text-muted-foreground pt-1">"{o.notes}"</p>}
            <p className="text-[11px] text-muted-foreground pt-1">MoMo: {o.momo_phone}</p>
          </div>
        )}

        <button onClick={() => setOpen((v) => !v)} className="text-[11px] text-primary font-semibold hover:underline">
          {open ? "Hide details" : "Show details"}
        </button>

        {canManage && (
          <Select value={o.assigned_to ?? ""} onValueChange={onAssign}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assign to staff..." /></SelectTrigger>
            <SelectContent>
              {staff.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No staff yet</div>
              ) : staff.map((s) => (
                <SelectItem key={s.user_id} value={s.user_id}>
                  {s.user_id === currentUserId ? "Me" : s.user_id.slice(0, 8)}…
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {mineOnly ? (
          <p className="text-[11px] text-muted-foreground italic">Assigned to another staff member.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {o.status === "pending" && onAccept && (
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onAccept}>
                <UserCheck className="w-3 h-3 mr-1" />Accept
              </Button>
            )}
            {o.status === "accepted" && (
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onStatus("preparing")}>
                Start preparing
              </Button>
            )}
            {o.status === "preparing" && (
              <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onStatus("ready")}>
                <CheckCircle2 className="w-3 h-3 mr-1" />Mark ready
              </Button>
            )}
            {o.status === "ready" && (
              <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onStatus("picked_up")}>
                Mark picked up
              </Button>
            )}
            {!["picked_up", "cancelled"].includes(o.status) && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatus("cancelled")}>
                Cancel
              </Button>
            )}
            {["picked_up", "ready"].includes(o.status) && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={onFlag}>
                <Flag className="w-3 h-3 mr-1" />Flag
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InventoryPanel({ branchId }: { branchId: string }) {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("branch_inventory")
      .select("*")
      .eq("branch_id", branchId)
      .order("product_id");
    const rows = (data ?? []) as InventoryRow[];
    setItems(rows);
    // load names from products_i18n (EN)
    if (rows.length) {
      const ids = rows.map((r) => r.product_id);
      const { data: tr } = await supabase
        .from("products_i18n")
        .select("product_id, name")
        .eq("lang", "EN")
        .in("product_id", ids);
      const map: Record<number, string> = {};
      (tr ?? []).forEach((t) => { map[t.product_id] = t.name; });
      setProductNames(map);
    }
    setLoading(false);
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const n = productNames[i.product_id] ?? "";
    return n.toLowerCase().includes(search.toLowerCase()) || String(i.product_id).includes(search);
  });

  const updateStock = async (row: InventoryRow, stock: number) => {
    const { error } = await supabase
      .from("branch_inventory")
      .update({ stock, in_stock: stock > 0 })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Stock updated");
    setEditing((p) => { const c = { ...p }; delete c[row.id]; return c; });
    load();
  };

  const toggleAvailable = async (row: InventoryRow) => {
    const { error } = await supabase
      .from("branch_inventory")
      .update({ in_stock: !row.in_stock })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search product name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inventory yet for this branch. Ask an admin to seed it.</p>
        ) : (
          <div className="divide-y">
            {filtered.slice(0, 200).map((row) => {
              const isEditing = editing[row.id] !== undefined;
              return (
                <div key={row.id} className="py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{productNames[row.product_id] ?? `#${row.product_id}`}</p>
                    <p className="text-[11px] text-muted-foreground">ID {row.product_id}</p>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0} className="w-20 h-8"
                        value={editing[row.id]}
                        onChange={(e) => setEditing((p) => ({ ...p, [row.id]: Number(e.target.value) }))}
                      />
                      <Button size="sm" className="h-8" onClick={() => updateStock(row, editing[row.id])}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing((p) => { const c = { ...p }; delete c[row.id]; return c; })}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => setEditing((p) => ({ ...p, [row.id]: row.stock }))} className="font-black text-sm hover:underline">
                      {row.stock} in stock
                    </button>
                  )}
                  <Button
                    size="sm" variant={row.in_stock ? "outline" : "destructive"} className="h-8"
                    onClick={() => toggleAvailable(row)}
                  >
                    {row.in_stock ? "Available" : "Out of stock"}
                  </Button>
                </div>
              );
            })}
            {filtered.length > 200 && (
              <p className="pt-3 text-xs text-muted-foreground">Showing first 200 of {filtered.length} matching items.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
