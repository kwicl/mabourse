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

export default function CategoryIcon({ icon, color = '#8e8e98', size = 40, className = '' }) {
  const Icon = ICONS[icon] || Circle;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.04] ${className}`}
      style={{ width: size, height: size, background: `${color}17`, color }}
    >
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.8} />
    </span>
  );
}
