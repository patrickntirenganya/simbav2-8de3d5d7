import * as React from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BranchReviewFormProps {
  orderId: string;
  branchId: string;
  branchName?: string;
  onSubmitted?: () => void;
}

export function BranchReviewForm({
  orderId,
  branchId,
  branchName,
  onSubmitted,
}: BranchReviewFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [existing, setExisting] = React.useState<{ rating: number; comment: string | null } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    supabase
      .from("branch_reviews")
      .select("rating, comment")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data);
          setRating(data.rating);
          setComment(data.comment ?? "");
        }
        setLoading(false);
      });
  }, [orderId, user]);

  const submit = async () => {
    if (!user || rating === 0) {
      toast.error(t.rateThisBranch);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("branch_reviews").upsert(
      {
        order_id: orderId,
        branch_id: branchId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: "order_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.reviewThanks);
    setExisting({ rating, comment: comment.trim() || null });
    onSubmitted?.();
  };

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-3">
        <Loader2 className="w-3 h-3 animate-spin" /> ...
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <div>
        <p className="font-bold text-sm">
          {existing ? t.alreadyReviewed : t.rateThisBranch}
          {branchName && <span className="text-muted-foreground"> · {branchName}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
            className="p-1"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.leaveComment}
        rows={2}
        maxLength={500}
      />
      <Button onClick={submit} disabled={submitting || rating === 0} size="sm">
        {submitting ? t.processing : t.submitReview}
      </Button>
    </div>
  );
}
