/** Contrôle segmenté sobre. */
export default function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <div className="inline-flex rounded-full border border-line bg-fg/5 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`${pad} shrink-0 whitespace-nowrap rounded-full font-medium transition-all duration-300 ease-out ${
              active
                ? 'bg-accent text-on-accent shadow-soft'
                : o.soft
                  ? 'bg-fg/10 text-fg hover:text-fg'
                  : 'text-fg-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
