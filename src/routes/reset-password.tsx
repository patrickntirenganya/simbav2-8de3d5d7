import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Set new password — Simba" }] }),
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase reset link puts a recovery session into the URL hash; getSession picks it up.
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error(t.passwordTooShort);
    if (pwd !== confirm) return toast.error(t.passwordsMismatch);
    setLoading(true);
    const { error } = await updatePassword(pwd);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success(t.passwordUpdated);
    navigate({ to: "/" });
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-black">{t.setNewPassword}</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="pwd">{t.newPassword}</Label>
                <Input id="pwd" type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t.confirmPassword}</Label>
                <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} size="lg" className="w-full font-bold">
                {loading ? t.processing : t.updatePassword}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
