import { useLayoutEffect, useRef, useState } from 'react';

/** Contrôle segmenté sobre : la pastille de l'option active glisse d'une option à l'autre. */
export default function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const box = useRef(null);
  const [pill, setPill] = useState(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const place = () => {
      const active = el.querySelector('[aria-pressed="true"]');
      setPill(active ? { x: active.offsetLeft, w: active.offsetWidth, ready: true } : null);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, options]);

  return (
    <div ref={box} className="relative inline-flex rounded-full border border-line bg-fg/5 p-1">
      {pill && (
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-0 top-1 rounded-full bg-accent shadow-soft transition-[transform,width] duration-500 ease-[cubic-bezier(0.22,0.9,0.24,1)] motion-reduce:transition-none"
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`${pad} relative shrink-0 whitespace-nowrap rounded-full font-medium transition-colors duration-300 ease-out ${
              active
                ? `text-on-accent ${pill ? '' : 'bg-accent shadow-soft'}`
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
