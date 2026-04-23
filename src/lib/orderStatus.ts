export type OrderStatus =
  | "pending_payment"
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "cancelled";

export const STATUS_LABEL: Record<OrderStatus, { EN: string; FR: string; RW: string }> = {
  pending_payment: { EN: "Awaiting payment", FR: "En attente de paiement", RW: "Bitegereje kwishyura" },
  pending: { EN: "New", FR: "Nouveau", RW: "Bishya" },
  accepted: { EN: "Accepted", FR: "Acceptée", RW: "Byemejwe" },
  preparing: { EN: "Preparing", FR: "En préparation", RW: "Biratunganywa" },
  ready: { EN: "Ready for pick-up", FR: "Prête à retirer", RW: "Biteguye gufata" },
  picked_up: { EN: "Picked up", FR: "Retirée", RW: "Byafashwe" },
  cancelled: { EN: "Cancelled", FR: "Hagaritswe", RW: "Hagaritswe" },
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  accepted: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  preparing: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  ready: "bg-green-500/15 text-green-700 dark:text-green-400",
  picked_up: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};
