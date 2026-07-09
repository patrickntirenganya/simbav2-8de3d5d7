import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartSidebar } from "@/components/CartSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { Toaster } from "@/components/ui/sonner";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

function OrderNotificationsMount() {
  useOrderNotifications();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            {children}
            <CartSidebar />
            <AIAssistant />
            <OrderNotificationsMount />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
