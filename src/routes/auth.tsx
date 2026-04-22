import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Sign in — Simba Supermarket" }],
  }),
});

function AuthPage() {
  const { user, signInWithEmail } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      navigate({ to: (redirect ?? "/") as "/" });
    }
  }, [user, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
      toast.success("Magic link sent! Check your inbox.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to shop
              </Link>
            </Button>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-black mb-2">Check your email</h1>
                <p className="text-sm text-muted-foreground mb-1">
                  We sent a sign-in link to
                </p>
                <p className="font-bold mb-6">{email}</p>
                <p className="text-xs text-muted-foreground">
                  Click the link in the email to continue. You can close this tab.
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black leading-tight">Continue with email</h1>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  No password needed. We'll email you a secure sign-in link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full font-bold">
                    {loading ? "Sending link..." : "Send sign-in link"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By continuing, you agree to Simba's Terms & Privacy.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
