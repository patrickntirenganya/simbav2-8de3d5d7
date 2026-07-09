import { useEffect, useState } from "react";

const IMAGES = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=1800",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1800",
  "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&q=80&w=1800",
  "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=1800",
];

/**
 * Full-bleed hero background: cross-fades between 4 supermarket photos
 * every 4.5s to grab attention. Pure CSS opacity transition — no libs.
 */
export function HeroSlideshow() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % IMAGES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {IMAGES.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          loading={idx === 0 ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms] ease-in-out"
          style={{
            opacity: idx === i ? 0.55 : 0,
            transform: idx === i ? "scale(1.05)" : "scale(1)",
            transitionProperty: "opacity, transform",
            transitionDuration: "1600ms, 5000ms",
          }}
        />
      ))}
    </div>
  );
}
