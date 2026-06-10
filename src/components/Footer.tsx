import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-black text-lg mb-3">Simba Supermarket</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rwanda's modern online supermarket. Shop fresh, pick up at your nearest branch.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"
              className="w-8 h-8 rounded-full bg-background border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-background border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"
              className="w-8 h-8 rounded-full bg-background border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm mb-3">Contact</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <a href="tel:+250788123456" className="hover:text-foreground">+250 788 123 456</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <a href="mailto:support@simba.rw" className="hover:text-foreground">support@simba.rw</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>KN 4 Ave, Kigali, Rwanda</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Mon–Sun · 08:00 – 21:00</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm mb-3">Shop</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/products" className="hover:text-foreground">{t.allProducts ?? "All products"}</Link></li>
            <li><Link to="/orders" className="hover:text-foreground">My orders</Link></li>
            <li><Link to="/auth" search={{ redirect: "/" }} className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm mb-3">Customer service</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><a href="mailto:support@simba.rw" className="hover:text-foreground">Help & support</a></li>
            <li><a href="tel:+250788123456" className="hover:text-foreground">Call us</a></li>
            <li><span>WhatsApp: +250 788 123 456</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} Simba Supermarket — Kigali, Rwanda</p>
          <p>Made with care · MoMo · Airtel Money</p>
        </div>
      </div>
    </footer>
  );
}
