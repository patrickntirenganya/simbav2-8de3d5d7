import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/format";

/**
 * Build a friendly, helpful description for a product when the source data
 * does not include one. Uses category, unit, name and price to produce a
 * short multi-paragraph blurb plus a list of "highlights".
 */
export function buildProductDescription(product: Product): {
  summary: string;
  highlights: string[];
  details: { label: string; value: string }[];
} {
  const cat = product.category;
  const unit = product.unit || "Pcs";
  const name = product.name;

  const categoryBlurbs: Record<string, string> = {
    "Electronics & Kitchenware":
      "A practical kitchen & home essential, picked for everyday Rwandan households. Built to last with reliable performance.",
    "Personal Care":
      "Carefully selected personal care item to help you look and feel your best, every single day.",
    "Beverages":
      "Refreshing beverage, perfect on its own or paired with a meal. Stored and handled to keep quality at its peak.",
    "Snacks":
      "A tasty snack ideal for sharing with family, friends, or keeping handy at home, school or the office.",
    "Groceries":
      "A pantry staple sourced for freshness, value, and quality you can trust on every shop.",
    "General":
      "An everyday useful item from the Simba catalogue, ready for pick-up at your nearest branch.",
  };

  const summary =
    categoryBlurbs[cat] ??
    `Quality ${cat.toLowerCase()} item available now at Simba Supermarket — ready for fast branch pick-up across Kigali.`;

  const highlights = [
    `Sold per ${unit.toLowerCase()}`,
    product.inStock ? "Currently in stock at participating branches" : "Temporarily out of stock",
    "Pay securely with MoMo, Airtel Money or card",
    "Pick up at your nearest Simba branch — usually in under 60 minutes",
  ];

  const details = [
    { label: "Product", value: name },
    { label: "Category", value: cat },
    { label: "Unit", value: unit },
    { label: "Price", value: formatPrice(product.price) },
    { label: "SKU", value: `SIMBA-${product.id}` },
  ];

  return { summary, highlights, details };
}
