import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Reset password — Simba" }] }),
});

function ForgotPasswordPage() {
  const { sendResetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error(t.enterValidEmail);
    setLoading(true);
    const { error } = await sendResetPassword(email.trim());
    setLoading(false);
    if (error) return toast.error(error);
    setSent(true);
    toast.success(t.resetLinkSent);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/auth" search={{ redirect: undefined, mode: "signin" }}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t.login}
              </Link>
            </Button>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-black mb-2">{t.resetLinkSent}</h1>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-black">{t.resetPassword}</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{t.resetPasswordDesc}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full font-bold">
                    {loading ? t.processing : t.sendResetLink}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
