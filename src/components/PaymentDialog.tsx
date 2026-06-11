import { useEffect, useState } from "react";
import { Smartphone, ShieldCheck, Loader2, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/format";

export type PaymentMethod = "mtn_momo" | "airtel_money" | "card";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  method: PaymentMethod;
  /** MoMo / Airtel phone, or last 4 of card. */
  reference: string;
  onConfirmed: () => void | Promise<void>;
}

type Stage = "prompt" | "waiting" | "approved" | "failed";

const methodMeta: Record<PaymentMethod, { label: string; sub: string; color: string }> = {
  mtn_momo: { label: "MTN Mobile Money", sub: "USSD push to your phone", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  airtel_money: { label: "Airtel Money", sub: "Approve on your handset", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  card: { label: "Card payment", sub: "Visa · Mastercard", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

export function PaymentDialog({
  open,
  onOpenChange,
  amount,
  method,
  reference,
  onConfirmed,
}: PaymentDialogProps) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>("prompt");
  const meta = methodMeta[method];
  const Icon = method === "card" ? CreditCard : Smartphone;

  useEffect(() => {
    if (open) setStage("prompt");
  }, [open]);

  const handleConfirm = async () => {
    setStage("waiting");
    // Simulate gateway round-trip
    await new Promise((r) => setTimeout(r, 1600));
    // 95% success simulation for realism
    if (Math.random() > 0.05) {
      setStage("approved");
      await new Promise((r) => setTimeout(r, 700));
      await onConfirmed();
    } else {
      setStage("failed");
    }
  };

  const dismissable = stage === "prompt" || stage === "failed";

  return (
    <Dialog open={open} onOpenChange={(o) => dismissable && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto p-3 rounded-2xl w-fit mb-2 ${meta.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black">
            {stage === "approved"
              ? t.orderPlaced
              : stage === "failed"
                ? "Payment failed"
                : `Confirm ${meta.label}`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {stage === "approved"
              ? t.orderPlacedDesc
              : stage === "failed"
                ? "Your payment could not be completed. Please try again or use another method."
                : meta.sub}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-xl p-4 my-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-black text-2xl text-primary">{formatPrice(amount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{method === "card" ? "Card" : "Phone"}</span>
            <span className="font-mono font-semibold">{reference}</span>
          </div>
        </div>

        {stage === "prompt" && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600" />
            Simulated payment — no real money is moved. In production, you'll receive a real prompt on your device.
          </p>
        )}

        {stage === "waiting" && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.processing}
          </div>
        )}

        {stage === "approved" && (
          <div className="flex items-center justify-center gap-2 text-green-600 py-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">{t.orderPlaced}</span>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex items-center justify-center gap-2 text-red-600 py-2">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">Declined</span>
          </div>
        )}

        {(stage === "prompt" || stage === "failed") && (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleConfirm} className="font-black">
              {stage === "failed" ? "Retry" : t.confirmPayment}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
