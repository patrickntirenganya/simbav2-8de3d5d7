import { useEffect, useState } from "react";
import { MapPin, Phone, Check, Store, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/branches";

interface BranchSelectorProps {
  value: string | null;
  onChange: (branchId: string) => void;
}

interface RatingAgg {
  avg: number;
  count: number;
}

export function BranchSelector({ value, onChange }: BranchSelectorProps) {
  const { t } = useLanguage();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingAgg>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: br }, { data: rv }] = await Promise.all([
        supabase.from("branches").select("*").eq("active", true).order("name"),
        supabase.from("branch_reviews").select("branch_id, rating"),
      ]);
      setBranches((br as unknown as Branch[]) ?? []);
      const agg: Record<string, { sum: number; count: number }> = {};
      ((rv as Array<{ branch_id: string; rating: number }>) ?? []).forEach((r) => {
        const a = agg[r.branch_id] ?? { sum: 0, count: 0 };
        a.sum += r.rating;
        a.count += 1;
        agg[r.branch_id] = a;
      });
      const out: Record<string, RatingAgg> = {};
      Object.entries(agg).forEach(([id, v]) => {
        out[id] = { avg: v.sum / v.count, count: v.count };
      });
      setRatings(out);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading branches...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-primary" />
        <h3 className="font-black text-base">{t.chooseBranch}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t.branchHint}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {branches.map((b) => {
          const active = b.id === value;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              className={cn(
                "text-left p-3 rounded-xl border-2 transition-all hover:border-primary/60",
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black text-sm truncate">{b.name.replace("Simba Supermarket ", "")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{b.address}</span>
                  </p>
                  {b.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      {b.phone}
                    </p>
                  )}
                  {ratings[b.id] && (
                    <p className="text-xs flex items-center gap-1 mt-1 font-bold">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {ratings[b.id].avg.toFixed(1)}
                      <span className="text-muted-foreground font-normal">
                        ({ratings[b.id].count})
                      </span>
                    </p>
                  )}
                </div>
                {active && (
                  <div className="bg-primary text-primary-foreground rounded-full p-1 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
