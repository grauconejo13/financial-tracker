import { useMemo, useState } from "react";

export type PieSlice = {
  name: string;
  value: number;
};

type Props = {
  data: PieSlice[];
  colors: string[];
  size?: number;
  formatValue?: (v: number) => string;
  title?: string;
  centerLabel?: string;
};

const DEFAULT_FORMAT = (v: number) => v.toFixed(2);

export function PieSvg({
  data,
  colors,
  size = 220,
  formatValue = DEFAULT_FORMAT,
  title,
  centerLabel = "Hover a slice",
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const slices = data.filter((d) => d.value > 0);

  const total = useMemo(() => slices.reduce((sum, row) => sum + row.value, 0), [slices]);
  if (total <= 0) return null;

  const radius = Math.max(50, Math.floor(size * 0.34));
  const cx = size / 2;
  const cy = size / 2;

  let angle = -Math.PI / 2;
  const paths = slices.map((slice, i) => {
    const theta = (slice.value / total) * Math.PI * 2;
    const x1 = cx + radius * Math.cos(angle);
    const y1 = cy + radius * Math.sin(angle);
    const next = angle + theta;
    const x2 = cx + radius * Math.cos(next);
    const y2 = cy + radius * Math.sin(next);
    const largeArc = theta > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    angle = next;
    return { path, color: colors[i % colors.length], slice };
  });

  return (
    <div className="cp-pie-wrap">
      {title ? <h4 className="cp-pie-title">{title}</h4> : null}
      <div className="cp-pie-content">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title || "Pie chart"}>
          {paths.map((p, i) => (
            <path
              key={`${p.slice.name}-${i}`}
              d={p.path}
              fill={p.color}
              opacity={hover == null || hover === i ? 1 : 0.55}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={Math.max(20, radius * 0.42)} fill="white" />
        </svg>
        <div className={`cp-pie-ghostbox ${hover != null ? "is-visible" : ""}`}>
          <div className="cp-pie-ghostbox__title">
            {hover != null ? paths[hover].slice.name : centerLabel}
          </div>
          <div className="cp-pie-ghostbox__value">
            {hover != null ? formatValue(paths[hover].slice.value) : ""}
          </div>
          <div className="cp-pie-ghostbox__hint">
            {hover != null
              ? `${((paths[hover].slice.value / total) * 100).toFixed(1)}% of this pie`
              : "Move over a slice to inspect it"}
          </div>
        </div>

        <div className="cp-pie-legend">
          {paths.map((p, i) => {
            const pct = ((p.slice.value / total) * 100).toFixed(1);
            return (
              <div
                key={`${p.slice.name}-legend-${i}`}
                className={`cp-pie-legend-row ${hover === i ? "is-active" : ""}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="cp-pie-dot" style={{ backgroundColor: p.color }} />
                <span className="cp-pie-label">{p.slice.name}</span>
                <span className="cp-pie-val">{formatValue(p.slice.value)}</span>
                <span className="cp-pie-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
