import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Subscribes (Supabase Realtime) to the current user's orders and
 * fires a toast + browser Notification when status changes to
 * "accepted", "preparing", "ready", "picked_up" or "cancelled".
 */
export function useOrderNotifications() {
  const { user } = useAuth();
  const lastStatus = useRef<Record<string, string>>({});

  // Ask for browser notification permission once, after user logs in.
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          const prev = lastStatus.current[row.id];
          lastStatus.current[row.id] = row.status;
          if (prev === row.status) return;

          const short = row.id.slice(0, 8);
          const messages: Record<string, { title: string; body: string }> = {
            accepted: { title: "Order accepted ✅", body: `Order #${short} accepted by the branch.` },
            preparing: { title: "Preparing your order 🛒", body: `Order #${short} is being prepared.` },
            ready: { title: "Ready for pick-up! 🎉", body: `Order #${short} is packed and waiting at your Simba branch.` },
            picked_up: { title: "Picked up ✔️", body: `Order #${short} was picked up. Enjoy!` },
            cancelled: { title: "Order cancelled", body: `Order #${short} has been cancelled.` },
          };
          const m = messages[row.status];
          if (!m) return;

          toast.success(m.title, { description: m.body, duration: 8000 });

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(m.title, { body: m.body, icon: "/favicon.ico" });
            } catch {
              /* ignore */
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
