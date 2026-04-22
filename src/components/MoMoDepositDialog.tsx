import { useEffect, useState } from "react";
import { Smartphone, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
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

interface MoMoDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  momoPhone: string;
  onConfirmed: () => void | Promise<void>;
}

type Stage = "prompt" | "waiting" | "approved";

export function MoMoDepositDialog({
  open,
  onOpenChange,
  amount,
  momoPhone,
  onConfirmed,
}: MoMoDepositDialogProps) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>("prompt");

  useEffect(() => {
    if (open) setStage("prompt");
  }, [open]);

  const handleConfirm = async () => {
    setStage("waiting");
    // Simulate the MoMo approval delay
    await new Promise((r) => setTimeout(r, 1400));
    setStage("approved");
    await new Promise((r) => setTimeout(r, 600));
    await onConfirmed();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => stage === "prompt" && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-black">
            {stage === "approved" ? t.orderPlaced : t.momoPrompt}
          </DialogTitle>
          <DialogDescription className="text-center">
            {stage === "approved" ? t.orderPlacedDesc : t.momoPromptDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-xl p-4 my-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.deposit}</span>
            <span className="font-black text-2xl text-primary">{formatPrice(amount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">MoMo</span>
            <span className="font-mono font-semibold">{momoPhone}</span>
          </div>
        </div>

        {stage === "prompt" && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600" />
            {t.depositExplain}
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

        {stage === "prompt" && (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleConfirm} className="font-black">
              {t.confirmPayment}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
