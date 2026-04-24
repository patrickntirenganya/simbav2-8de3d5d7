import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Search = { redirect?: string; mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Simba Supermarket" }] }),
});

function AuthPage() {
  const { user, signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { redirect, mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: (redirect ?? "/") as "/" });
  }, [user, redirect, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error(t.enterValidEmail);
    setLoading(true);
    const { error } = await signInWithPassword(email.trim(), password);
    setLoading(false);
    if (error) toast.error(t.invalidCredentials);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error(t.enterValidEmail);
    if (password.length < 6) return toast.error(t.passwordTooShort);
    if (password !== confirm) return toast.error(t.passwordsMismatch);
    setLoading(true);
    const { error } = await signUpWithPassword(email.trim(), password, fullName.trim() || undefined);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success(t.accountCreated);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) toast.error(error);
  };

  const isSignup = tab === "signup";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t.backToShop}
              </Link>
            </Button>

            <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  !isSignup ? "bg-background shadow" : "text-muted-foreground"
                }`}
              >
                {t.login}
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  isSignup ? "bg-background shadow" : "text-muted-foreground"
                }`}
              >
                {t.register}
              </button>
            </div>

            <h1 className="text-2xl font-black mb-1">{isSignup ? t.createAccount : t.welcomeBack}</h1>
            <p className="text-sm text-muted-foreground mb-5">
              {isSignup ? t.signUpDesc : t.signInDesc}
            </p>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full font-bold mb-3"
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon />
              {t.continueWithGoogle}
            </Button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                {t.orContinueWith}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={isSignup ? handleSignUp : handleSignIn} className="space-y-3">
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">{t.confirmPassword}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}
              {!isSignup && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t.forgotPassword}
                  </Link>
                </div>
              )}
              <Button type="submit" disabled={loading} size="lg" className="w-full font-bold">
                {loading ? t.processing : isSignup ? t.register : t.login}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-5">
              {isSignup ? t.haveAccount : t.noAccount}{" "}
              <button
                type="button"
                onClick={() => setTab(isSignup ? "signin" : "signup")}
                className="text-primary font-bold hover:underline"
              >
                {isSignup ? t.login : t.register}
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
