import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "branch_manager" | "branch_staff" | "customer";

export interface UserRole {
  id: string;
  role: AppRole;
  branch_id: string | null;
}

export function useMyRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("user_roles")
      .select("id, role, branch_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setRoles((data ?? []) as UserRole[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = roles.some((r) => r.role === "admin");
  const managerBranches = roles.filter((r) => r.role === "branch_manager").map((r) => r.branch_id!).filter(Boolean);
  const staffBranches = roles.filter((r) => r.role === "branch_staff").map((r) => r.branch_id!).filter(Boolean);
  const isManager = managerBranches.length > 0;
  const isStaff = staffBranches.length > 0;
  const myBranchId = managerBranches[0] ?? staffBranches[0] ?? null;
  const hasStaffAccess = isAdmin || isManager || isStaff;

  return { roles, loading, isAdmin, isManager, isStaff, myBranchId, managerBranches, staffBranches, hasStaffAccess };
}
