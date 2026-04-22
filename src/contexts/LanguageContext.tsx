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
    // Phase 2 — pick-up checkout
    pickupBranch: "Pick-up branch",
    selectBranch: "Select a branch",
    chooseBranch: "Choose your pick-up branch",
    branchHint: "We'll prepare your order for collection here.",
    pickupTime: "Pick-up time",
    pickupToday: "Today",
    pickupTomorrow: "Tomorrow",
    chooseTime: "Choose a pick-up time",
    yourDetails: "Your details",
    fullName: "Full name",
    phoneNumber: "Phone number",
    momoNumber: "MoMo phone number",
    momoHint: "A payment prompt will be sent to this number.",
    notesOptional: "Order notes (optional)",
    notesPlaceholder: "Any special instructions...",
    deposit: "Pick-up deposit",
    depositExplain: "A small refundable deposit holds your order so staff don't pack it for nothing.",
    payDeposit: "Pay deposit",
    processing: "Processing...",
    momoPrompt: "MoMo prompt sent",
    momoPromptDesc: "Approve the prompt on your phone to confirm the deposit.",
    confirmPayment: "Confirm payment",
    cancel: "Cancel",
    orderPlaced: "Order placed!",
    orderPlacedDesc: "Your branch has been notified and will start preparing your order.",
    continueShopping: "Continue shopping",
    orderSummary: "Order summary",
    subtotalLabel: "Subtotal",
    payNow: "Pay now",
    minOrder: "Add at least one item to checkout.",
    invalidMomo: "Enter a valid Rwandan MoMo number (e.g. 07XXXXXXXX)",
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
    pickupBranch: "Magasin de retrait",
    selectBranch: "Sélectionner un magasin",
    chooseBranch: "Choisissez votre magasin de retrait",
    branchHint: "Nous préparerons votre commande pour le retrait ici.",
    pickupTime: "Heure de retrait",
    pickupToday: "Aujourd'hui",
    pickupTomorrow: "Demain",
    chooseTime: "Choisissez une heure de retrait",
    yourDetails: "Vos coordonnées",
    fullName: "Nom complet",
    phoneNumber: "Numéro de téléphone",
    momoNumber: "Numéro MoMo",
    momoHint: "Une demande de paiement sera envoyée à ce numéro.",
    notesOptional: "Notes de commande (facultatif)",
    notesPlaceholder: "Instructions particulières...",
    deposit: "Acompte de retrait",
    depositExplain: "Un petit acompte garantit votre commande pour que le personnel ne la prépare pas pour rien.",
    payDeposit: "Payer l'acompte",
    processing: "Traitement...",
    momoPrompt: "Demande MoMo envoyée",
    momoPromptDesc: "Approuvez la demande sur votre téléphone pour confirmer l'acompte.",
    confirmPayment: "Confirmer le paiement",
    cancel: "Annuler",
    orderPlaced: "Commande passée !",
    orderPlacedDesc: "Le magasin a été notifié et commence à préparer votre commande.",
    continueShopping: "Continuer mes achats",
    orderSummary: "Résumé de la commande",
    subtotalLabel: "Sous-total",
    payNow: "Payer",
    minOrder: "Ajoutez au moins un article pour commander.",
    invalidMomo: "Entrez un numéro MoMo rwandais valide (ex. 07XXXXXXXX)",
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
    pickupBranch: "Iduka ryo gufata",
    selectBranch: "Hitamo iduka",
    chooseBranch: "Hitamo iduka uzafataho ibyaguzwe",
    branchHint: "Tuzategura ibyaguzwe kugira ngo ubifatire hano.",
    pickupTime: "Igihe cyo gufata",
    pickupToday: "Uyu munsi",
    pickupTomorrow: "Ejo",
    chooseTime: "Hitamo igihe cyo gufata",
    yourDetails: "Amakuru yawe",
    fullName: "Amazina yose",
    phoneNumber: "Nimero ya telefoni",
    momoNumber: "Nimero ya MoMo",
    momoHint: "Ubutumwa bwo kwishyura buzoherezwa kuri iyi nimero.",
    notesOptional: "Inyandiko (si itegeko)",
    notesPlaceholder: "Amabwiriza yihariye...",
    deposit: "Avansi yo gufata",
    depositExplain: "Avansi nto irinda ko abakozi babika ibyaguzwe ku busa.",
    payDeposit: "Ishyura avansi",
    processing: "Bitunganywa...",
    momoPrompt: "MoMo yoherejwe",
    momoPromptDesc: "Emeza kuri telefoni yawe kugira ngo wuzuze avansi.",
    confirmPayment: "Emeza kwishyura",
    cancel: "Hagarika",
    orderPlaced: "Itegeko ryashyizweho!",
    orderPlacedDesc: "Iduka ryamenyeshejwe kandi ririmo gutegura ibyaguzwe.",
    continueShopping: "Komeza kugura",
    orderSummary: "Incamake y'itegeko",
    subtotalLabel: "Igiteranyo",
    payNow: "Ishyura",
    minOrder: "Ongeraho byibuze ikintu kimwe.",
    invalidMomo: "Andika nimero ya MoMo nziza yo mu Rwanda (urugero 07XXXXXXXX)",
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
