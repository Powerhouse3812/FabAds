interface VariantToggleProps {
  variant: 'v1' | 'v2' | 'v3';
  onChange: (v: 'v1' | 'v2' | 'v3') => void;
}

export function VariantToggle({ variant, onChange }: VariantToggleProps) {
  return (
    <div
      aria-label="Select variant"
      className="inline-flex items-center rounded-full border border-border bg-muted/30 p-0.5 gap-0.5"
    >
      {(['v1', 'v2', 'v3'] as const).map((v) => {
        const active = variant === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              'px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {v.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default VariantToggle;
