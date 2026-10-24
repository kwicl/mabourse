/** Contrôle segmenté sobre. */
export default function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <div className="inline-flex rounded-full border border-sand-line bg-ink-100/70 p-1 dark:border-night-line dark:bg-white/[0.03]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`${pad} rounded-full font-medium transition-all duration-300 ease-out ${
              active
                ? 'bg-white text-ink-900 shadow-soft dark:bg-white/[0.1] dark:text-ink-50'
                : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
