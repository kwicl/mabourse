import {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  Car,
  Circle,
  Coffee,
  Ellipsis,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  House,
  LandPlot,
  Laptop,
  PiggyBank,
  Plane,
  Refrigerator,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Stethoscope,
  Trees,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';

// Icônes disponibles pour les catégories (colonne `icon` de la feuille Categories, ou src/utils/categoryVisual.js)
export const ICONS = {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  Car,
  Circle,
  Coffee,
  Ellipsis,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  House,
  LandPlot,
  Laptop,
  PiggyBank,
  Plane,
  Refrigerator,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Stethoscope,
  Trees,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Zap,
};

/** Icône de catégorie en couleur : pastille teintée + pictogramme de la couleur de la catégorie. */
export default function CategoryIcon({ icon, color, size = 40, className = '' }) {
  const Icon = ICONS[icon] || Circle;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{
        width: size,
        height: size,
        background: color ? `${color}33` : 'rgb(var(--fg) / 0.08)',
        boxShadow: color ? `inset 0 0 0 1px ${color}59` : 'inset 0 0 0 1px rgb(var(--fg) / 0.1)',
        color: color || 'rgb(var(--fg))',
      }}
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={2} />
    </span>
  );
}
