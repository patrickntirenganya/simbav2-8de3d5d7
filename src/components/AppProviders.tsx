import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartSidebar } from "@/components/CartSidebar";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            {children}
            <CartSidebar />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
