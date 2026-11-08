/* Rebond gélatineux au toucher sur les boutons .water-glow (délégation globale, aucun composant modifié). */
import './water-button.css';

document.addEventListener(
  'pointerdown',
  (e) => {
    const btn = e.target.closest?.('.water-glow');
    if (!btn || btn.disabled) return;
    btn.classList.remove('water-pop');
    void btn.offsetWidth; // relance l'animation même en cas de clics rapides
    btn.classList.add('water-pop');
  },
  { passive: true },
);

document.addEventListener('animationend', (e) => {
  if (e.animationName === 'water-pop') e.target.classList.remove('water-pop');
});
