import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShoppingCart,
  Search,
  Globe,
  Moon,
  Sun,
  User,
  LogOut,
  Package,
  Heart,
  GitCompare,
  Grid3x3,
  Home,
  Store,
  Tag,
  Phone,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRoles } from "@/hooks/useRoles";
import { categories } from "@/lib/products";
import { Button } from "@/components/ui/button";
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

const ORANGE = "bg-[oklch(0.68_0.21_45)]";
const ORANGE_DARK = "bg-[oklch(0.6_0.21_38)]";

export function Header({ search = "", setSearch }: HeaderProps) {
  const { totalItems, openCart } = useCart();
  const { lang, t, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin, hasStaffAccess } = useMyRoles();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [pickup, setPickup] = useState("Centenary");
  useEffect(() => setMounted(true), []);

  const handleSearchChange = (v: string) => {
    if (setSearch) setSearch(v);
    else navigate({ to: "/products", search: { q: v, category: undefined } });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q: search || undefined, category: undefined } });
  };

  return (
    <header className="sticky top-0 z-50 text-white">
      {/* ===== Top utility strip ===== */}
      <div className={`${ORANGE_DARK} text-[11px] sm:text-xs`}>
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4 opacity-90">
            <Link to="/" className="hover:opacity-100 opacity-80">Help</Link>
            <Link to="/" className="hover:opacity-100 opacity-80">Track Order</Link>
            <Link to="/" className="hover:opacity-100 opacity-80">FAQ</Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pickup at</span>
                <span className="bg-white/15 rounded-full px-2 py-0.5 font-semibold">{pickup}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["Centenary","Remera","Kimironko","Kacyiru","Nyamirambo","Gikondo","Kanombe","Kinyinya","Kibagabaga","Nyanza"].map((b) => (
                  <DropdownMenuItem key={b} onClick={() => setPickup(b)}>{b}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 opacity-90 hover:opacity-100">
                <Globe className="w-3.5 h-3.5" />
                <span className="font-semibold">{lang}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["EN","FR","RW"] as Language[]).map((l) => (
                  <DropdownMenuItem key={l} onClick={() => changeLanguage(l)}>
                    {l === "EN" ? "English" : l === "FR" ? "Français" : "Kinyarwanda"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-1 opacity-90 hover:opacity-100"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-semibold">
                {mounted && theme === "dark" ? "Light" : "Dark"} Theme
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main row: logo + search + account/wishlist/cart ===== */}
      <div className={ORANGE}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-full bg-white grid place-items-center overflow-hidden shrink-0">
              <img
                src="https://www.simbaonlineshopping.com/images/simbaheaderM.png"
                alt="Simba"
                className="w-9 h-9 object-contain"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-black text-lg tracking-tight">Simba Supermarket</div>
              <div className="text-[11px] opacity-90">Online Shopping · Kigali</div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={submitSearch} className="flex-1 max-w-2xl">
            <div className="flex items-stretch bg-white rounded-full overflow-hidden shadow-sm">
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t.search}
                className="flex-1 px-5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="px-2 text-slate-400 hover:text-slate-600 text-lg"
                  aria-label="Clear"
                >
                  ×
                </button>
              )}
              <button
                type="submit"
                className={`${ORANGE_DARK} hover:opacity-90 px-5 flex items-center justify-center`}
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          {/* Right-side icons */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-90">
                    <User className="w-6 h-6" />
                    <div className="hidden md:block text-left leading-tight">
                      <div className="text-sm font-bold">Account</div>
                      <div className="text-[11px] opacity-90 truncate max-w-[120px]">{user.email}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth", search: { redirect: undefined } })}
                className="flex items-center gap-2 hover:opacity-90"
              >
                <User className="w-6 h-6" />
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-sm font-bold">{t.signIn}</div>
                  <div className="text-[11px] opacity-90">Account</div>
                </div>
              </button>
            )}

            <button
              className="hidden sm:grid place-items-center w-9 h-9 rounded-full hover:bg-white/10"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </button>

            <button
              className="hidden sm:grid place-items-center w-9 h-9 rounded-full hover:bg-white/10"
              aria-label="Compare"
            >
              <GitCompare className="w-5 h-5" />
            </button>

            <button
              onClick={openCart}
              className="relative grid place-items-center w-10 h-10 rounded-full hover:bg-white/10"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[10px] font-black w-4 h-4 rounded-full grid place-items-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Secondary nav row ===== */}
      <div className={`${ORANGE_DARK} border-t border-white/10`}>
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-4 h-9 rounded-md font-bold text-sm">
              <Grid3x3 className="w-4 h-4" />
              <span>Browse Categories</span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-auto">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => navigate({ to: "/products", search: { q: undefined, category: cat } })}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="hidden md:flex items-center gap-7 text-sm font-bold">
            <Link to="/" className="flex items-center gap-1.5 hover:opacity-80">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link
              to="/products"
              search={{ q: undefined, category: undefined }}
              className="flex items-center gap-1.5 hover:opacity-80"
            >
              <Store className="w-4 h-4" /> Shop
            </Link>
            <Link
              to="/products"
              search={{ q: undefined, category: undefined }}
              className="flex items-center gap-1.5 text-yellow-300 hover:opacity-80"
            >
              <Tag className="w-4 h-4" /> Best Discounts
              <ChevronDown className="w-3.5 h-3.5" />
            </Link>
          </nav>

          <Button
            asChild
            className="bg-white text-[oklch(0.6_0.21_38)] hover:bg-white/90 rounded-full h-9 px-4 font-bold text-sm"
          >
            <a href="tel:+250788000000">
              <Phone className="w-4 h-4 mr-2" /> Contact us
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
