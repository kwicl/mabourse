import {
  ArrowLeftRight,
  Briefcase,
  Car,
  Circle,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';

// Icônes disponibles pour les catégories (colonne `icon` de la feuille Categories)
export const ICONS = {
  ArrowLeftRight,
  Briefcase,
  Car,
  Circle,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Zap,
};

/** Icône de catégorie : neutre (texte de la surface) ; `color` = couleur de graphique du thème (légendes). */
export default function CategoryIcon({ icon, color, size = 40, className = '' }) {
  const Icon = ICONS[icon] || Circle;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-fg/10 ${className}`}
      style={{ width: size, height: size, background: color ? `${color}2E` : 'rgb(var(--fg) / 0.08)', color: color || 'rgb(var(--fg))' }}
    >
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.8} />
    </span>
  );
}
