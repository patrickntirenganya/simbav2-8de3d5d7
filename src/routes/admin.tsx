import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Shield, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles, type AppRole } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
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

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useMyRoles();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [emailToUserId, setEmailToUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // form
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("branch_staff");
  const [newBranchId, setNewBranchId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [user, authLoading, navigate]);

  const refresh = async () => {
    setLoading(true);
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from("branches").select("*").order("name"),
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
    ]);
    setBranches((b ?? []) as Branch[]);
    setRoles((r ?? []) as RoleRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  if (authLoading || roleLoading) return null;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-black">Admin only</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to access this page. Sign in as the admin account
            (the first user registered).
          </p>
          <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
        </main>
      </div>
    );
  }

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return toast.error("Enter a user ID (UUID)");
    if ((newRole === "branch_manager" || newRole === "branch_staff") && !newBranchId) {
      return toast.error("Select a branch for this role");
    }
    setSubmitting(true);
    const payload: { user_id: string; role: AppRole; branch_id: string | null } = {
      user_id: userId.trim(),
      role: newRole,
      branch_id: newRole === "admin" || newRole === "customer" ? null : newBranchId,
    };
    const { error } = await supabase.from("user_roles").insert(payload);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Role granted");
    setUserId("");
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

  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Home</Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-xl"><Shield className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Role assignment</h1>
            <p className="text-xs text-muted-foreground">Promote users to branch manager or staff.</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleGrant} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="uid">User ID (UUID)</Label>
                <Input
                  id="uid"
                  required
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Ask the user to sign in once, then copy their UUID from their account menu.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_staff">Branch staff</SelectItem>
                    <SelectItem value="branch_manager">Branch manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={newBranchId}
                  onValueChange={setNewBranchId}
                  disabled={newRole === "admin"}
                >
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
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
                  {submitting ? "Granting..." : "Grant role"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <h2 className="font-black text-lg mb-3">Existing roles</h2>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : roles.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No roles yet.</div>
            ) : (
              <div className="divide-y">
                {roles.map((r) => (
                  <div key={r.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate">{r.user_id}</p>
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
            <p className="font-semibold text-foreground mb-1">Your user ID:</p>
            <code className="font-mono text-foreground break-all">{user.id}</code>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
