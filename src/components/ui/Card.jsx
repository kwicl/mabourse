export default function Card({ title, subtitle, action, className = '', children, style }) {
  return (
    <section className={`glass animate-fade-up p-6 sm:p-7 ${className}`} style={style}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>}
            {subtitle && <p className="mt-1 text-[13px] text-fg-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
