import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-900/20 backdrop-blur-md dark:bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl border border-sand-line bg-cream/95 p-7 shadow-lift backdrop-blur-xl dark:border-night-line dark:bg-night-card/95 sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="serif text-2xl">{title}</h3>
          <button onClick={onClose} className="btn-ghost h-9 w-9 !p-0" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
