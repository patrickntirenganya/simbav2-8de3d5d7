import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Shield, Trash2, UserPlus, Languages, Boxes } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles, type AppRole } from "@/hooks/useRoles";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/lib/products";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Branch } from "@/lib/branches";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin · Roles — Simba" }] }),
});

interface RoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  branch_id: string | null;
  created_at: string;
}
interface ProfileRow { id: string; email: string | null; full_name: string | null }

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useMyRoles();
  const { t, refreshProductTranslations } = useLanguage();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [emailOrId, setEmailOrId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("branch_staff");
  const [newBranchId, setNewBranchId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [translating, setTranslating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [user, authLoading, navigate]);

  const refresh = async () => {
    setLoading(true);
    const [{ data: b }, { data: r }, { data: p }] = await Promise.all([
      supabase.from("branches").select("*").order("name"),
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }),
    ]);
    setBranches((b ?? []) as Branch[]);
    setRoles((r ?? []) as RoleRow[]);
    setProfiles((p ?? []) as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (authLoading || roleLoading) return null;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-black">{t.adminOnly}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t.adminOnlyDesc}</p>
          <Button asChild className="mt-6"><Link to="/">{t.goHome}</Link></Button>
        </main>
      </div>
    );
  }

  const resolveUserId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return trimmed;
    // email lookup
    const found = profiles.find((p) => p.email?.toLowerCase() === trimmed.toLowerCase());
    return found?.id ?? null;
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = resolveUserId(emailOrId);
    if (!uid) return toast.error("User not found. Make sure they have signed up first.");
    if ((newRole === "branch_manager" || newRole === "branch_staff") && !newBranchId) {
      return toast.error(t.selectBranchPlaceholder);
    }
    setSubmitting(true);
    const payload = {
      user_id: uid,
      role: newRole,
      branch_id: newRole === "admin" || newRole === "customer" ? null : newBranchId,
    };
    const { error } = await supabase.from("user_roles").insert(payload);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Role granted");
    setEmailOrId("");
    setNewBranchId("");
    refresh();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this role?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Role revoked");
    refresh();
  };

  const handlePretranslate = async () => {
    setTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("not signed in");
      const payload = {
        products: products.map((p) => ({ id: p.id, name: p.name, category: p.category, unit: p.unit })),
        languages: ["EN", "FR", "RW"],
      };
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const json = await resp.json();
      if (!resp.ok) {
        toast.error(json.error || "translation failed");
      } else {
        toast.success(`${t.translationDone} (${json.upserted})`);
        await refreshProductTranslations();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    const ids = products.map((p) => p.id);
    const { data, error } = await supabase.rpc("seed_branch_inventory", { _product_ids: ids });
    setSeeding(false);
    if (error) return toast.error(error.message);
    toast.success(`${t.seeded} (+${data ?? 0} rows)`);
  };

  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "—";
  const userLabel = (uid: string) => {
    const p = profiles.find((x) => x.id === uid);
    return p?.email || uid.slice(0, 8) + "…";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />{t.home}</Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-xl"><Shield className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{t.adminTitle}</h1>
            <p className="text-xs text-muted-foreground">{t.adminDesc}</p>
          </div>
        </div>

        {/* ==== Setup tools: pre-translate + seed inventory ==== */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-5 h-5 text-primary" />
                <h2 className="font-black">{t.pretranslate}</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{t.pretranslateDesc}</p>
              <Button onClick={handlePretranslate} disabled={translating} size="sm">
                {translating ? t.translating : t.translateAll}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Boxes className="w-5 h-5 text-primary" />
                <h2 className="font-black">{t.seedInventory}</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{t.seedInventoryDesc}</p>
              <Button onClick={handleSeed} disabled={seeding} size="sm" variant="outline">
                {seeding ? t.processing : t.seedNow}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ==== Grant role form ==== */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleGrant} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="uid">{t.user} (email or UUID)</Label>
                <Input
                  id="uid" required
                  placeholder="user@example.com"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Ask the user to sign up first, then enter their email here.
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t.role}</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_staff">{t.branchStaff}</SelectItem>
                    <SelectItem value="branch_manager">{t.branchManager}</SelectItem>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.branch}</Label>
                <Select value={newBranchId} onValueChange={setNewBranchId} disabled={newRole === "admin"}>
                  <SelectTrigger><SelectValue placeholder={t.selectBranchPlaceholder} /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {submitting ? t.granting : t.grantRole}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <h2 className="font-black text-lg mb-3">{t.existingRoles}</h2>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">...</div>
            ) : roles.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">—</div>
            ) : (
              <div className="divide-y">
                {roles.map((r) => (
                  <div key={r.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{userLabel(r.user_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold capitalize text-foreground">{r.role.replace("_", " ")}</span>
                        {r.branch_id ? ` · ${branchName(r.branch_id)}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRevoke(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-muted/40">
          <CardContent className="p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">{t.yourUserId}</p>
            <code className="font-mono text-foreground break-all">{user.id}</code>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
