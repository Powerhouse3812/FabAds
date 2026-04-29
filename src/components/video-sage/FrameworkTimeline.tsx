interface Segment {
  label: string;
  duration: number;
  color: string;
}

interface Props {
  segments: Segment[];
}

export default function FrameworkTimeline({ segments }: Props) {
  const total = segments.reduce((s, seg) => s + seg.duration, 0);

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex rounded-md overflow-hidden h-8">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] font-semibold text-white relative"
            style={{
              width: `${(seg.duration / total) * 100}%`,
              backgroundColor: seg.color,
            }}
          >
            <span className="truncate px-1">{seg.label}</span>
          </div>
        ))}
      </div>

      {/* Duration labels */}
      <div className="flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-muted-foreground"
            style={{ width: `${(seg.duration / total) * 100}%` }}
          >
            {seg.duration}s
          </div>
        ))}
      </div>
    </div>
  );
}
