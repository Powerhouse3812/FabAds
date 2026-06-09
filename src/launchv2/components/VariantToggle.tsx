interface VariantToggleProps {
  variant: 'v1' | 'v2';
  onToggle: () => void;
}

export function VariantToggle({ variant, onToggle }: VariantToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${variant === 'v1' ? 'V2' : 'V1'}`}
      className="inline-flex items-center rounded-full border border-border bg-muted/30 p-0.5 gap-0.5"
    >
      {(['v1', 'v2'] as const).map((v) => {
        const active = variant === v;
        return (
          <span
            key={v}
            className={[
              'px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {v.toUpperCase()}
          </span>
        );
      })}
    </button>
  );
}

export default VariantToggle;
