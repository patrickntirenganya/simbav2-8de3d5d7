import productsData from "@/data/simba_products.json";
import type { Product } from "@/types/product";

export const products = (productsData as { products: Product[] }).products;

export const categories = Array.from(new Set(products.map((p) => p.category))).sort();

export function getProductById(id: number) {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string) {
  return products.filter((p) => p.category === category);
}
