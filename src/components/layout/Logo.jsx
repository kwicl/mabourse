/** Logo mABOUrse : portrait noir & blanc + badge dollar. */
export function LogoMark({ size = 40 }) {
  const badge = Math.round(size * 0.46);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <img
        src="/avatar-bw.png"
        alt="mABOUrse"
        className="h-full w-full rounded-full object-cover grayscale ring-1 ring-sand-line dark:ring-night-line"
      />
      <span
        className="absolute -bottom-0.5 -right-1 flex items-center justify-center rounded-full bg-accent font-serif font-medium text-white ring-2 ring-cream dark:ring-night"
        style={{ width: badge, height: badge, fontSize: badge * 0.66 }}
      >
        $
      </span>
    </span>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={40} />
      <span className="font-serif text-[22px] tracking-[-0.01em]">
        m<span className="font-semibold">ABOU</span>rse
      </span>
    </div>
  );
}
