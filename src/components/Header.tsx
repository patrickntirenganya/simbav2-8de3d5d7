import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, Globe, Moon, Sun, User, LogOut, Package } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  search?: string;
  setSearch?: (s: string) => void;
}

export function Header({ search = "", setSearch }: HeaderProps) {
  const { totalItems, openCart } = useCart();
  const { lang, t, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin, hasStaffAccess } = useMyRoles();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSearchChange = (v: string) => {
    if (setSearch) {
      setSearch(v);
    } else {
      navigate({ to: "/products", search: { q: v, category: undefined } });
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://www.simbaonlineshopping.com/images/simbaheaderM.png"
            alt="Simba Supermarket"
            className="h-9 w-auto"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xl font-black tracking-tight text-primary hidden sm:inline">
            SIMBA
          </span>
        </Link>

        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t.search}
            className="pl-10 rounded-full h-10 bg-muted border-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">{lang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["EN", "FR", "RW"] as Language[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => changeLanguage(l)}>
                  {l === "EN" ? "English" : l === "FR" ? "Français" : "Kinyarwanda"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={openCart}
            className="relative"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <Package className="w-4 h-4 mr-2" />
                  {t.orders}
                </DropdownMenuItem>
                {hasStaffAccess && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/staff" })}>
                    <Package className="w-4 h-4 mr-2" />
                    {t.branchDashboard}
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Package className="w-4 h-4 mr-2" />
                    {t.adminRoles}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate({ to: "/auth", search: { redirect: undefined } })}
            >
              {t.signIn}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
