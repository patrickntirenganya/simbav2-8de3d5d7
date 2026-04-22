import productsData from "@/data/simba_products.json";
import type { Product } from "@/types/product";

export const products = (productsData as { products: Product[] }).products;

export const categories = Array.from(new Set(products.map((p) => p.category))).sort();

// Pick the first product image per category as the category thumbnail (Getir-style)
export const categoryImages: Record<string, string> = categories.reduce(
  (acc, cat) => {
    const first = products.find((p) => p.category === cat && p.image);
    if (first) acc[cat] = first.image;
    return acc;
  },
  {} as Record<string, string>,
);

export function getProductById(id: number) {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string) {
  return products.filter((p) => p.category === category);
}
