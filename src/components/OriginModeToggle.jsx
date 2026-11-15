import { Moon, Sun } from 'lucide-react';
import { useAppTheme } from '../theme/useAppTheme';

/** Bascule jour / nuit, proposée uniquement avec le design d'origine. `variant` : 'icon' ou 'row'. */
export default function OriginModeToggle({ variant = 'icon', className = '' }) {
  const { origin, theme, toggleOriginMode } = useAppTheme();
  if (!origin) return null;
  const Icon = theme.dark ? Moon : Sun;
  if (variant === 'row') {
    return (
      <button onClick={toggleOriginMode} className={`btn-ghost w-full justify-between !rounded-xl !px-3 text-xs ${className}`}>
        <span>{theme.dark ? 'Mode sombre' : 'Mode clair'}</span>
        <Icon size={14} />
      </button>
    );
  }
  return (
    <button onClick={toggleOriginMode} className={`btn-ghost h-10 w-10 !p-0 ${className}`} aria-label="Changer de mode jour / nuit">
      {theme.dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
