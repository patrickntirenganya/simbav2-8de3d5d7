import * as React from "react";

export type Language = "EN" | "FR" | "RW";

const translations = {
  EN: {
    search: "Search products, brands, categories...",
    cart: "Cart",
    signIn: "Sign In",
    signOut: "Sign Out",
    categories: "Categories",
    allProducts: "All Products",
    recommended: "Recommended for you",
    addToCart: "Add to Cart",
    total: "Total",
    checkout: "Checkout",
    sortBy: "Sort by",
    popularity: "Popularity",
    lowToHigh: "Price: Low to High",
    highToLow: "Price: High to Low",
    home: "Home",
    products: "Products",
    orders: "My Orders",
    emptyCart: "Your cart is empty",
    exploreProducts: "Explore Products",
    subtotal: "Subtotal",
    delivery: "Delivery",
    free: "FREE",
    proceedToPay: "Proceed to Pay",
    loginToCheckout: "Log in to complete your order",
  },
  FR: {
    search: "Rechercher des produits, marques...",
    cart: "Panier",
    signIn: "Se connecter",
    signOut: "Déconnexion",
    categories: "Catégories",
    allProducts: "Tous les produits",
    recommended: "Recommandé pour vous",
    addToCart: "Ajouter au panier",
    total: "Total",
    checkout: "Commander",
    sortBy: "Trier par",
    popularity: "Popularité",
    lowToHigh: "Prix: Croissant",
    highToLow: "Prix: Décroissant",
    home: "Accueil",
    products: "Produits",
    orders: "Mes commandes",
    emptyCart: "Votre panier est vide",
    exploreProducts: "Explorer les produits",
    subtotal: "Sous-total",
    delivery: "Livraison",
    free: "GRATUIT",
    proceedToPay: "Procéder au paiement",
    loginToCheckout: "Connectez-vous pour finaliser",
  },
  RW: {
    search: "Shaka ibicuruzwa...",
    cart: "Ikarita",
    signIn: "Injira",
    signOut: "Sohoka",
    categories: "Ibyiciro",
    allProducts: "Ibicuruzwa byose",
    recommended: "Ibyatoranyijwe",
    addToCart: "Shyira mu ikarita",
    total: "Hose",
    checkout: "Ishura",
    sortBy: "Tondeka",
    popularity: "Ibikunzwe",
    lowToHigh: "Igiciro: Gito",
    highToLow: "Igiciro: Kinini",
    home: "Ahabanza",
    products: "Ibicuruzwa",
    orders: "Amateka yanjye",
    emptyCart: "Ikarita yawe ntakintu irimo",
    exploreProducts: "Reba ibicuruzwa",
    subtotal: "Igiteranyo",
    delivery: "Gutanga",
    free: "UBUSA",
    proceedToPay: "Komeza kwishyura",
    loginToCheckout: "Injira kugira ngo urangize",
  },
};

interface LanguageContextType {
  lang: Language;
  t: (typeof translations)["EN"];
  changeLanguage: (l: Language) => void;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Language>("EN");

  React.useEffect(() => {
    const saved = localStorage.getItem("simba_lang") as Language | null;
    if (saved && translations[saved]) setLang(saved);
  }, []);

  const changeLanguage = React.useCallback((l: Language) => {
    setLang(l);
    localStorage.setItem("simba_lang", l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
