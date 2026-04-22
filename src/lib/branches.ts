export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  opens_at: string;
  closes_at: string;
  active: boolean;
}

/** Default deposit in RWF held by MoMo to confirm a pick-up order. */
export const PICKUP_DEPOSIT_RWF = 500;

/**
 * Generate the next ~16 pickup time slots in 30-minute increments,
 * starting 1 hour from now, between 08:00 and 21:00.
 */
export function generatePickupSlots(now = new Date()): Date[] {
  const slots: Date[] = [];
  const start = new Date(now);
  start.setMinutes(start.getMinutes() + 60); // earliest = +1h
  // round up to next :00 or :30
  const m = start.getMinutes();
  start.setMinutes(m <= 30 ? 30 : 60, 0, 0);

  let cursor = new Date(start);
  while (slots.length < 16) {
    const h = cursor.getHours();
    if (h >= 8 && h < 21) slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 30);
    // safety: stop after 3 days
    if (cursor.getTime() - now.getTime() > 3 * 24 * 60 * 60 * 1000) break;
  }
  return slots;
}

export function formatSlot(d: Date, lang: "EN" | "FR" | "RW"): string {
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const labelMap = {
    EN: { today: "Today", tomorrow: "Tomorrow" },
    FR: { today: "Aujourd'hui", tomorrow: "Demain" },
    RW: { today: "Uyu munsi", tomorrow: "Ejo" },
  } as const;
  const dayLabel = isToday
    ? labelMap[lang].today
    : isTomorrow
      ? labelMap[lang].tomorrow
      : d.toLocaleDateString(lang === "FR" ? "fr-FR" : "en-RW", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dayLabel} · ${time}`;
}
