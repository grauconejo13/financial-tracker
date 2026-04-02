import { useMemo, useState, useCallback } from "react";

export interface PieSlice {
  name: string;
  value: number;
  hint?: string;
}

interface PieSvgProps {
  data: PieSlice[];
  colors: string[];
  size?: number;
  innerRatio?: number;
  formatValue?: (v: number) => string;
  chartTitle?: string;
  chartExplainer?: string;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function donutPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const sweep = endAngle - startAngle;
  const large = sweep > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, startAngle);
  const p2 = polar(cx, cy, rOuter, endAngle);
  const p3 = polar(cx, cy, rInner, endAngle);
  const p4 = polar(cx, cy, rInner, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function PieSvg({
  data,
  colors,
  size = 260,
  innerRatio = 0.55,
  formatValue = (v) => v.toLocaleString(),
  chartTitle,
  chartExplainer,
}: PieSvgProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { paths, total } = useMemo(() => {
    const filtered = data.filter((d) => d.value > 0);
    const sum = filtered.reduce((a, b) => a + b.value, 0);
    if (sum <= 0) return { paths: [] as { d: string; name: string; value: number; color: string; hint?: string }[], total: 0 };

    let angle = -Math.PI / 2;
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = size * 0.38;
    const rInner = rOuter * innerRatio;
    const out: { d: string; name: string; value: number; color: string; hint?: string }[] = [];

    filtered.forEach((slice, i) => {
      const sweep = (slice.value / sum) * Math.PI * 2;
      const start = angle;
      const end = angle + sweep;
      out.push({
        d: donutPath(cx, cy, rOuter, rInner, start, end),
        name: slice.name,
        value: slice.value,
        color: colors[i % colors.length],
        hint: slice.hint,
      });
      angle = end;
    });

    return { paths: out, total: sum };
  }, [data, colors, size, innerRatio]);

  const clearHover = useCallback(() => setHovered(null), []);

  if (total <= 0) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted py-5" style={{ minHeight: size * 0.6 }}>
        No data
      </div>
    );
  }

  const active = hovered !== null ? paths[hovered] : null;

  return (
    <div className="pie-svg-wrap">
      {(chartTitle || chartExplainer) && (
        <p className="pie-chart-meta small text-muted mb-2 mb-md-3">
          {chartTitle && <strong className="text-secondary d-block">{chartTitle}</strong>}
          {chartExplainer && <span className="d-block mt-1">{chartExplainer}</span>}
        </p>
      )}
      <div className="pie-svg-inner w-100" onMouseLeave={clearHover}>
        <div className="d-flex flex-wrap align-items-center gap-3 justify-content-center w-100">
          <svg width={size} height={size} role="img" aria-label="Pie chart" className="pie-svg-canvas">
            {paths.map((p, i) => (
              <path
                key={`${p.name}-${i}`}
                d={p.d}
                fill={p.color}
                stroke="#fff"
                strokeWidth={1.5}
                className="pie-slice-path"
                style={{
                  opacity: hovered === null || hovered === i ? 1 : 0.38,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={() => setHovered(i)}
              />
            ))}
          </svg>
          <div className={`pie-hover-floater ${active ? "is-visible" : ""}`} aria-live="polite">
            {active && (
              <>
                <div className="pie-hover-floater__segment">{active.name}</div>
                <div className="pie-hover-floater__value">{formatValue(active.value)}</div>
                {active.hint && <div className="small text-muted mt-1">{active.hint}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

